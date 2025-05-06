import * as line from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { UserStatesService } from 'src/user-states/user-states.service';
import { UsersService } from 'src/users/users.service';
import { WhatMealFlex } from './flex-message';
import { UserState } from 'src/user-states/entities/user-state.entity';

@Injectable()
export class WaitingCaseHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WaitingCaseHandler.name);

  constructor(
    private readonly userService: UsersService,
    private readonly userStatesService: UserStatesService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  private checkSourceUser(event: line.MessageEvent): boolean {
    return event.source.type === 'user';
  }

  private async sendReplyMessage(
    replyToken: string,
    text: string,
  ): Promise<void> {
    await this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }

  private async removeUserState(userStateId: number): Promise<void> {
    this.logger.debug('User state removed:', userStateId);
    await this.userStatesService.remove(userStateId);
  }

  private async handleCancel(
    event: line.MessageEvent,
    userStateId: number,
  ): Promise<void> {
    await this.client.pushMessage({
      to: event.source.userId || '',
      messages: [{ type: 'text', text: 'ยกเลิกการบันทึกอาหาร' }],
    });
    await this.removeUserState(userStateId);
  }

  async waitingMealImage(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    if (!this.checkSourceUser(event)) {
      throw new Error('Event source not user type');
    }

    if (event.message.type === 'image') {
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [WhatMealFlex],
      });
      await this.removeUserState(user_state.id);
      this.logger.debug('User state removed:', user_state.user);
      await this.userStatesService.create({
        user: user_state.user,
        state: 'waiting for what meal',
      });
    } else if (
      event.message.type === 'text' &&
      event.message.text === 'ยกเลิก'
    ) {
      await this.handleCancel(event, user_state.id);
    } else {
      await this.sendReplyMessage(event.replyToken, 'ยังจะบันทึกอยู่มั้ย');
    }
  }

  async waitingWhatMeal(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    if (!this.checkSourceUser(event)) {
      throw new Error('Event source not user type');
    }

    if (event.message.type === 'text') {
      const mealResponses = {
        เช้า: 'มะลิบันทึกเป็นอาหารเช้าเรียบร้อยค่า',
        กลางวัน: 'มะลิบันทึกเป็นอาหารกลางวันเรียบร้อยค่า',
        เที่ยง: 'มะลิบันทึกอาหารกลางวันเรียบร้อยค่า',
        เย็น: 'มะลิบันทึกเป็นอาหารเย็นเรียบร้อยค่า',
        ของว่าง: 'มะลิบันทึกเป็นของว่างเรียบร้อยค่า',
      };

      const messageText = event.message.text;

      // Check if the message matches any meal keyword
      const response = Object.keys(mealResponses).find((key) =>
        messageText.includes(key),
      );

      if (response) {
        // Send the corresponding reply
        await this.sendReplyMessage(event.replyToken, mealResponses[response]);

        // Remove user state
        await this.removeUserState(user_state.id);
      } else if (messageText.includes('ยกเลิก')) {
        await this.handleCancel(event, user_state.id);
      } else {
        // Default case: invalid input
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'กรุณาเลือกมื้ออาหารที่ต้องการบันทึก หรือพิมพ์ "ยกเลิก" เพื่อยกเลิกการบันทึก',
            },
          ],
        });
      }
    }
  }
}
