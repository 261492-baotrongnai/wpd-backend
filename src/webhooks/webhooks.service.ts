import { Injectable } from '@nestjs/common';
import { GreetingFlex } from './flex-message';
import * as line from '@line/bot-sdk';
import { UsersService } from 'src/users/users.service';
import { getInternalId } from 'src/users/user-utility';

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

  async handleTextMessage(replyToken: string, userMessage: string) {
    console.log('Received message:', userMessage);
    await this.client.replyMessage({
      replyToken: replyToken,
      messages: [{ type: 'text', text: `You said: ${userMessage}` }],
    });
  }

  async handleFollowEvent(replyToken: string, userId: string) {
    try {
      // Validate environment variable
      const secretKey = process.env.INTERNAL_ID_SECRET;
      if (!secretKey) throw new Error('INTERNAL_ID_SECRET is not defined');
      if (!userId) throw new Error('User ID is missing in the follow event');

      console.log(`Processing follow event for userId: ${userId}`);

      // Retrieve internal ID
      const internalId = await getInternalId(
        secretKey,
        undefined,
        undefined,
        userId,
      );
      if (typeof internalId !== 'string') {
        throw new Error(
          `Failed to retrieve internalId:${JSON.stringify(internalId)}`,
        );
      }

      // Create or find user
      const user = await this.userService.create({
        internalId: internalId,
      });
      console.log('User created or found:', user);

      // Send a greeting flex message
      await this.client.replyMessage({
        replyToken,
        messages: [GreetingFlex],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error handling follow event:', error);
      throw error;
    }
  }
}
