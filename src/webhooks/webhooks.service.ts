import { Injectable, Logger } from '@nestjs/common';
import { AskForImageFlex, ClassifyFlex, GreetingFlex } from './flex-message';
import * as line from '@line/bot-sdk';
import { UsersService } from 'src/users/users.service';
import { UserStatesService } from 'src/user-states/user-states.service';
import { getInternalId } from 'src/users/user-utility';
import axios from 'axios';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { WaitingCaseHandler } from './waiting-case';

// const secretKey = process.env.INTERNAL_ID_SECRET;

@Injectable()
export class WebhooksService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksService.name);

  // Initialize LINE SDK client and import user service
  constructor(
    private readonly userService: UsersService,
    private readonly userStatesService: UserStatesService,
    private readonly waitingCaseHandler: WaitingCaseHandler,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async checkUserState(uid: string) {
    const iid = await getInternalId(undefined, uid);
    const user = await this.userService.findUserByInternalId(iid);
    this.logger.debug(`CheckUserState - User found: ${user?.id}`);
    if (!user || user.states.length === 0) {
      this.logger.error('User not found or no states in checkUserState');
      return null;
    } else {
      const user_states = await this.userStatesService.findAllByUser(user.id);
      return user_states;
    }
  }

  async isUserExist(userId: string) {
    const sk = process.env.INTERNAL_ID_SECRET;
    if (!sk) throw new Error('INTERNAL_ID_SECRET is not defined');
    const iid = await getInternalId(undefined, userId);

    if (typeof iid !== 'string') {
      throw new Error(`Failed to get internal ID at webhooks service`);
    }
    const isExist = await this.userService.findUserByInternalId(iid);

    return isExist !== null;
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

  async handleMealRecord(replyToken: string, uid: string) {
    await this.client.replyMessage({
      replyToken,
      messages: [AskForImageFlex],
    });
    const iid = await getInternalId(undefined, uid);

    const user = await this.userService.findUserByInternalId(iid);
    if (!user) this.logger.error('User not found in handleMealRecord');
    else {
      await this.userStatesService.create({
        user,
        state: 'waiting for meal image',
      });
    }
  }

  async handleWaitingState(event: line.WebhookEvent, user_state: UserState) {
    this.logger.debug('Handling waiting state:', user_state.state);
    if (!event.source.userId) {
      this.logger.error('User ID not found in event source');
      return;
    }
    if (event.type === 'message') {
      switch (user_state.state) {
        case 'waiting for meal image':
          await this.waitingCaseHandler.waitingMealImage(event, user_state);
          break;
        case 'waiting for what meal':
          await this.waitingCaseHandler.waitingWhatMeal(event, user_state);
      }
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

  async loading(userId: string): Promise<void> {
    await axios.post(
      'https://api.line.me/v2/bot/chat/loading/start',
      { chatId: userId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
  }
}
