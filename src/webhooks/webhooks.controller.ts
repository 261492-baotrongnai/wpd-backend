import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksController.name);
  constructor(
    readonly webhookService: WebhooksService,
    @InjectQueue('webhook') private readonly webhooksQueue: Queue,
  ) {}

  @Post('')
  async getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: Buffer;
    },
    @Res() res: Response,
  ) {
    // Need to receive raw body as Buffer because some messsage from flex actions can't be validate the parsed body
    // Verify the signature
    const isValid = line.validateSignature(
      req.body.toString(),
      process.env.LINE_CHANNEL_SECRET || '',
      req.headers['x-line-signature'],
    );

    if (!isValid) {
      this.logger.warn('Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Parse the request body after verifying the signature
    // The body is a Buffer, so we need to convert it to a string
    // and then parse it as JSON
    const body = JSON.parse(req.body.toString()) as {
      events: line.WebhookEvent[];
    };
    const events: line.WebhookEvent[] = body.events;
    await this.webhooksQueue.add('webhook-events', {
      context: events,
    });

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
                  case 'ยันยันการบันทึกผู้ใช้':
                    this.logger.debug('User requested to confirm registration');
                    await this.webhookService.handleConfirmRegistration(
                      event.replyToken,
                    );
                    break;
                  case 'ยันยันการแก้ไขโค้ด':
                    this.logger.debug('User requested to confirm code change');
                    await this.webhookService.handleConfirmCodeChange(
                      event.replyToken,
                      uid,
                    );
                    break;
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
                await this.webhookService.handleNonRegisteredUser(
                  event.replyToken,
                  uid,
                );
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
      } catch {
        this.logger.error(`Error processing event: ${JSON.stringify(event)}`);
      }
    }
  }
}
