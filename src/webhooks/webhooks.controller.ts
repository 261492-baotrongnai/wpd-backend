import { Body, Controller, Post, Req } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';

function verifySignature(
  channelSecret: string,
  body: string,
  signature: string,
): boolean {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

@Controller('webhooks')
export class WebhooksController {
  @Post('')
  async getWebhook(
    @Req() req: { headers: { [key: string]: string }; body: any },
  ) {
    console.log('Received webhook headers:', req.headers);
    console.log('Received webhook body:', req.body);

    // Verify the signature
    const isValid = verifySignature(
      process.env.LINE_CHANNEL_SECRET || '',
      JSON.stringify(req.body),
      req.headers['x-line-signature'],
    );
    if (!isValid) {
      return { message: 'Invalid signature' };
    }

    // Process the events
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;

        // Reply to the user
        await this.replyMessage(replyToken, `You said: ${userMessage}`);
      }
    }

    // Respond with HTTP 200 to acknowledge receipt
    return { message: 'Webhook received' };
  }

  private async replyMessage(replyToken: string, message: string) {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHANNEL_ACCES_TOKEN}`,
    };
    const body = {
      replyToken,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    };

    try {
      await axios.post(url, body, { headers });
      console.log('Reply sent successfully');
    } catch (error) {
      console.error(
        'Error sending reply:',
        error.response?.data || error.message,
      );
    }
  }
}
