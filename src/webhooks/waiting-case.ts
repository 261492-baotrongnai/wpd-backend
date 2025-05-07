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
import * as path from 'path';
import * as fs from 'fs';
import { PendingUploadsService } from 'src/pending-uploads/pending-uploads.service';

@Injectable()
export class WaitingCaseHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WaitingCaseHandler.name);
  private readonly s3Client = createS3Client();

  constructor(
    private readonly userService: UsersService,
    private readonly userStatesService: UserStatesService,
    private readonly imagesService: ImagesService,
    private readonly pendingUploadsService: PendingUploadsService,
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

  async saveToUploadsDir(
    fileName: string,
    imageContent: Buffer,
  ): Promise<string> {
    const uploadDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadDir, fileName);

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save the buffer to the uploads directory
    await fs.promises.writeFile(filePath, imageContent);
    this.logger.log(`File saved locally: ${filePath}`);
    return filePath;
  }

  async postToSpace(
    user_id: number,
    file_name: string,
    file_path: string,
    file_type: string,
  ): Promise<void> {
    // Upload the image from the local directory to the Space bucket
    const key = `meal_images/${user_id}/${file_name}`;
    const uploadParams = {
      Bucket: process.env.SPACE_NAME,
      Key: key,
      Body: fs.createReadStream(file_path), // Pass the Buffer directly
      ContentType: `image/${file_type}`, // Set the correct content type
      ACL: 'private' as ObjectCannedACL,
    };

    // Upload the image to the cloud bucket
    const parallelUpload = new Upload({
      client: this.s3Client,
      params: uploadParams,
    });

    await parallelUpload.done();
    this.logger.log(`File uploaded successfully: ${file_name}`);
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

      // Save the image content to the uploads directory
      const filePath = await this.saveToUploadsDir(fileName, imageContent);

      await this.removeUserState(user_state.id);
      this.logger.debug('User state removed:', user_state.user);
      const new_user_state = await this.userStatesService.create({
        user: user_state.user,
        state: 'waiting for what meal',
      });

      await this.pendingUploadsService.create({
        fileName,
        filePath,
        userState: new_user_state,
        status: 'pending for meal confirm',
      });

      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [WhatMealFlex],
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
        this.logger.debug('Pending: ', user_state.pendingUpload);
        const fileName = user_state.pendingUpload?.fileName;
        const filePath = user_state.pendingUpload?.filePath;
        if (!filePath) {
          throw new Error(
            'File path not found in user state [ waitingWhatMeal ]',
          );
        }
        if (!fileName) {
          throw new Error(
            'File name not found in user state [ waitingWhatMeal ]',
          );
        }
        await this.imagesService.create({
          name: fileName,
          user: user_state.user,
        });
        await this.postToSpace(
          user_state.user.id,
          fileName,
          filePath,
          fileName.split('.').pop() || 'jpg',
        );

        await this.removeUserState(user_state.id);
        // Send the corresponding reply
        await this.sendReplyMessage(
          event.source.userId
            ? event.source.userId
            : (() => {
                throw new Error('User ID not found');
              })(),
          mealResponses[response],
        );
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
