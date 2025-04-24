import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GreetingFlex } from './flex-message';

@Injectable()
export class WebhooksService {
  async replyMessage(replyToken: string, message: string) {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
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

  async replyFollow(replyToken: string) {
    const url = 'https://api.line.me/v2/bot/message/reply';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
    };
    const body = {
      replyToken,
      messages: [GreetingFlex],
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
