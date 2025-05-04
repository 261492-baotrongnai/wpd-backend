import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';
import { Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksController.name);
  constructor(readonly webhookService: WebhooksService) {}

  @Post('')
  getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: {
        destination: string;
        events: line.WebhookEvent[];
      };
    },
    @Res() res: Response,
  ) {
    this.logger.debug(`Received webhook from: ${req.body.destination}`);

    // Verify the signature
    const isValid = line.validateSignature(
      JSON.stringify(req.body),
      process.env.LINE_CHANNEL_SECRET || '',
      req.headers['x-line-signature'],
    );
    this.logger.log(`Signature verification result: ${isValid}`);

    if (!isValid) {
      this.logger.warn('Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const events = req.body.events;
    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events to process' });
    }

    // Send 200 OK immediately to acknowledge receipt
    res.status(200).json({ message: 'Webhook received' });

    // Process the events asynchronously after sending the response
    this.processEvents(events).catch((error) => {
      this.logger.error('Error processing events:', error);
    });
  }

  private async processEvents(events: line.WebhookEvent[]): Promise<void> {
    for (const event of events) {
      try {
        this.logger.debug('Processing event:', event);
        if (event.source.type !== 'user') {
          this.logger.warn(
            'Received event from non-user source type:',
            event.source.type,
          );
          continue;
        }

        await this.webhookService.loading(event.source.userId);
        const uid = event.source.userId;
        if (event.type === 'message') {
          // check if user has any waiting state before processing the message
          const user_states = await this.webhookService.checkUserState(uid);
          this.logger.debug('User states: ', user_states);
          // if there no waiting state, process the message normally
          if (user_states === null) {
            if (event.message?.type === 'text') {
              if (
                uid &&
                (await this.webhookService.isUserExist(uid)) === true
              ) {
                switch (event.message.text) {
                  case 'บันทึกอาหารที่ทาน':
                    this.logger.debug('User requested to record meal:');
                    await this.webhookService.handleMealRecord(
                      event.replyToken,
                      uid,
                    );
                }
              } else {
                this.logger.warn(
                  'Received message from non-registered user, message:',
                  event.message.text,
                );
                await this.webhookService.handleNonRegisteredUser(uid);
              }
            }
          } else {
            this.logger.log('handle waiting state');
            for (const user_state of user_states) {
              await this.webhookService.handleWaitingState(event, user_state);
            }
          }
        } else if (event.type === 'follow') {
          await this.webhookService.handleFollowEvent(event.replyToken);
        } else {
          this.logger.warn(`Unsupported event type: ${event.type}`);
        }
      } catch (error) {
        this.logger.error(
          `Error processing event: ${JSON.stringify(event)}`,
          error,
        );
      }
    }
  }
}
