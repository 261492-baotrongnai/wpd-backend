import { Body, Controller, Post, Req } from '@nestjs/common';
import { verifySignature } from './webhooks-utility';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(readonly webhookService: WebhooksService) {}
  @Post('')
  async getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: {
        events: Array<{
          type: string;
          replyToken: string;
          message: { type: string; text: string };
        }>;
      };
    },
  ) {
    // console.log('Received webhook headers:', req.headers);
    // console.log('Received webhook body:', req.body);
    // console.log('LINE Channel Secret:', process.env.LINE_CHANNEL_SECRET);

    // Verify the signature
    const isValid = verifySignature(
      process.env.LINE_CHANNEL_SECRET || '',
      JSON.stringify(req.body),
      req.headers['x-line-signature'],
    );
    if (!isValid) {
      return { message: 'Invalid signature', status: 405 };
    }

    // Process the events
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;
        await this.webhookService.replyMessage(
          replyToken,
          `You said: ${userMessage}`,
        );
      }
      if (event.type === 'follow') {
        const replyToken = event.replyToken;
        await this.webhookService.replyFollow(replyToken);
      }
    }

    // Respond with HTTP 200 to acknowledge receipt
    return { message: 'Webhook received' };
  }
}
