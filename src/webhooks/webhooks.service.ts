import { Injectable } from '@nestjs/common';
import { ClassifyFlex, GreetingFlex } from './flex-message';
import * as line from '@line/bot-sdk';
import { UsersService } from 'src/users/users.service';
import { getInternalId } from 'src/users/user-utility';

const secretKey = process.env.INTERNAL_ID_SECRET;

@Injectable()
export class WebhooksService {
  private readonly client: line.messagingApi.MessagingApiClient;

  // Initialize LINE SDK client and import user service
  constructor(private readonly userService: UsersService) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async isUserExist(userId: string) {
    if (!secretKey) throw new Error('INTERNAL_ID_SECRET is not defined');
    const iid = await getInternalId(undefined, userId);
    if (typeof iid !== 'string') {
      throw new Error(`Failed to get internal ID at webhooks service`);
    }
    return this.userService.findUserByInternalId(iid) != null ? true : false;
  }

  async handleTextMessage(replyToken: string, userMessage: string) {
    console.log('Received message:', userMessage);
    await this.client.replyMessage({
      replyToken: replyToken,
      messages: [{ type: 'text', text: `You said: ${userMessage}` }],
    });
  }

  async handleFollowEvent(replyToken: string) {
    try {
      // Send a greeting flex messages
      await this.client.replyMessage({
        replyToken,
        messages: [GreetingFlex, ClassifyFlex],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error handling follow event:', error);
      throw error;
    }
  }

  async handleNonRegisteredUser(userId: string) {
    try {
      await this.client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'text',
            text: `คุณยังไม่ได้ลงทะเบียนในระบบ กรุณาเลือกประเภทผู้ใช้งาน และยอมรับเงื่อนไขการใช้งาน`,
          },
          ClassifyFlex,
        ],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error handling non-registered user:', error);
      throw error;
    }
  }
}
