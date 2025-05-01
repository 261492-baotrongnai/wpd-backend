import { Controller, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';
import { Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  constructor(readonly webhookService: WebhooksService) {}

  @Post('')
  getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: {
        events: line.WebhookEvent[];
      };
    },
    @Res() res: Response,
  ) {
    console.log('Received webhook:', req.body);

    // Verify the signature
    const isValid = line.validateSignature(
      JSON.stringify(req.body),
      process.env.LINE_CHANNEL_SECRET || '',
      req.headers['x-line-signature'],
    );

    if (!isValid) {
      console.warn('Invalid signature');
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
      console.error('Error processing events:', error);
    });
  }

  private async processEvents(events: line.WebhookEvent[]): Promise<void> {
    for (const event of events) {
      try {
        if (event.source.type !== 'user') {
          console.warn(
            'Received event from non-user source type:',
            event.source.type,
          );
          continue;
        }

        await this.webhookService.loading(event.source.userId);

        if (event.type === 'message' && event.message?.type === 'text') {
          if (
            event.source.userId &&
            (await this.webhookService.isUserExist(event.source.userId)) ===
              true
          ) {
            await this.webhookService.handleTextMessage(
              event.replyToken,
              event.message.text,
            );
          } else {
            console.warn(
              'Received message from non-registered user, message:',
              event.message.text,
            );
            if (event.source.userId) {
              await this.webhookService.handleNonRegisteredUser(
                event.source.userId,
              );
            } else {
              throw new Error('User ID is undefined');
            }
          }
        } else if (event.type === 'follow') {
          await this.webhookService.handleFollowEvent(event.replyToken);
        } else {
          console.warn(`Unsupported event type: ${event.type}`);
        }
      } catch (error) {
        console.error(
          `Error processing event: ${JSON.stringify(event)}`,
          error,
        );
      }
    }
  }
}
