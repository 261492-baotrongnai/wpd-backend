import * as line from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { UserStatesService } from 'src/user-states/user-states.service';
import { UsersService } from 'src/users/users.service';
import { WhatMealFlex } from './flex-message';
import { UserState } from 'src/user-states/entities/user-state.entity';
import axios from 'axios';
import { createS3Client } from 'src/images/spaceUtil';
import { ImagesService } from 'src/images/images.service';
import { Upload } from '@aws-sdk/lib-storage';
import { ObjectCannedACL } from '@aws-sdk/client-s3';

@Injectable()
export class WaitingCaseHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WaitingCaseHandler.name);
  private readonly s3Client = createS3Client();

  constructor(
    private readonly userService: UsersService,
    private readonly userStatesService: UserStatesService,
    private readonly imagesService: ImagesService,
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

  private async sendReplyMessage(userId: string, text: string): Promise<void> {
    await this.client.pushMessage({
      to: userId,
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

  async getMessageContent(
    messageId: string,
  ): Promise<{ buffer: Buffer; fileType: string }> {
    const response = await axios.get(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
        },
        responseType: 'arraybuffer', // Ensure binary data is handled correctly
      },
    );

    if (!response.data) {
      throw new Error('Failed to fetch image content');
    }

    // Extract the file type from the Content-Type header
    const contentType = response.headers['content-type'] as string;
    if (!contentType) {
      throw new Error('Content-Type header is missing');
    }
    const fileType = contentType.split('/')[1]; // e.g., 'jpeg', 'png'

    // Convert the binary data to a Buffer
    const buffer = Buffer.from(response.data as ArrayBuffer);

    return { buffer, fileType };
  }

  async waitingMealImage(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    if (!this.checkSourceUser(event)) {
      throw new Error('Event source not user type');
    }

    if (event.message.type === 'image') {
      // Fetch the image content and file type
      const { buffer: imageContent, fileType } = await this.getMessageContent(
        event.message.id,
      );

      // Define the file name with the correct extension
      const fileName = `${event.message.id}.${fileType}`;
      const key = `meal_images/${user_state.user.id}/${fileName}`;
      const uploadParams = {
        Bucket: process.env.SPACE_NAME,
        Key: key,
        Body: imageContent, // Pass the Buffer directly
        ContentType: `image/${fileType}`, // Set the correct content type
        ACL: 'private' as ObjectCannedACL,
      };

      // Upload the image to the cloud bucket
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      await parallelUpload.done();
      this.logger.log(`File uploaded successfully: ${fileName}`);

      // Save the image metadata to the database
      await this.imagesService.create({
        name: fileName,
        user: user_state.user,
      });
      this.logger.log('Image saved to database:', fileName);

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
      if (!event.source.userId) {
        throw new Error('UserId is not present in waiting meal image');
      }
      await this.sendReplyMessage(event.source.userId, 'ยังจะบันทึกอยู่มั้ย');
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
        await this.sendReplyMessage(
          event.source.userId
            ? event.source.userId
            : (() => {
                throw new Error('User ID not found');
              })(),
          mealResponses[response],
        );

        // Remove user state
        await this.removeUserState(user_state.id);
        return;
      } else if (messageText.includes('ยกเลิก')) {
        await this.handleCancel(event, user_state.id);
        return;
      }
    }
    // Handle other message types (e.g., stickers, images)
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
