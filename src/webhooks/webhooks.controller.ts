import { Controller, Post, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  constructor(readonly webhookService: WebhooksService) {}

  @Post('')
  async getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: {
        events: line.WebhookEvent[];
      };
    },
  ) {
    // Verify the signature
    const isValid = line.validateSignature(
      JSON.stringify(req.body),
      process.env.LINE_CHANNEL_SECRET || '',
      req.headers['x-line-signature'],
    );
    if (!isValid) {
      return { message: 'Invalid signature', status: 405 };
    }

    // Process the events
    const events = req.body.events;

    for (const event of events) {
      try {
        if (event.source.type !== 'user') {
          console.warn(
            'Received event from non-user source type:',
            'Event:',
            event.source.type,
          );
        } else {
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
                'received message from non-registered user,',
                ' message:',
                event.message.text,
              );
              await this.webhookService.handleNonRegisteredUser(
                event.source.userId ??
                  (() => {
                    throw new Error('User ID is undefined');
                  })(),
              );
            }
          } else if (
            event.type === 'follow' &&
            'isUnblocked' in event['follow'] === false
          ) {
            await this.webhookService.handleFollowEvent(event.replyToken);
          } else {
            console.warn(`Unsupported event type: ${event.type}`);
          }
        }
      } catch (error) {
        console.error(
          `Error processing event: ${JSON.stringify(event)}`,
          error,
        );
      }
    }

    // Respond with HTTP 200 to acknowledge receipt
    return { message: 'Webhook received' };
  }
}
