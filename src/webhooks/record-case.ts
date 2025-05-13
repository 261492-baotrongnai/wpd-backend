import * as line from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { UserStatesService } from 'src/user-states/user-states.service';
import { UsersService } from 'src/users/users.service';
import { MenuChoiceConfirmFlex, WhatMealFlex } from './flex-message';
import { UserState } from 'src/user-states/entities/user-state.entity';
import axios from 'axios';
import { createS3Client } from 'src/images/spaceUtil';
import { ImagesService } from 'src/images/images.service';
import { Upload } from '@aws-sdk/lib-storage';
import { ObjectCannedACL } from '@aws-sdk/client-s3';
import * as path from 'path';
import * as fs from 'fs';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { CancleQuickReply, ImageQuickReply } from './quick-reply';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecordCaseHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(RecordCaseHandler.name);
  private readonly s3Client = createS3Client();

  constructor(
    private readonly userService: UsersService,
    private readonly userStatesService: UserStatesService,
    private readonly imagesService: ImagesService,
    private readonly api: ExternalApiService,
    private readonly configService: ConfigService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  private checkSourceUser(event: line.MessageEvent): string {
    if (event.source.type !== 'user') {
      throw new Error('Event source is not user type');
    }
    return event.source.userId;
  }

  private async sendReplyTextMessage(
    userId: string,
    text: string,
  ): Promise<void> {
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
      Body: fs.createReadStream(file_path),
      ContentType: `image/${file_type}`,
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
    const userId = this.checkSourceUser(event);

    if (event.message.type === 'image') {
      // Fetch the image content and file type
      const { buffer: imageContent, fileType } = await this.getMessageContent(
        event.message.id,
      );

      const candidates = await this.api.getMenuCandidates(undefined, {
        buffer: imageContent,
        mimeType: `image/${fileType}`,
      });
      this.logger.debug('Menu name: ', candidates);
      if (!candidates || candidates.length === 0) {
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'ไม่ใช่รูปอาหาร กรุณาส่งรูปอาหารอีกครั้งค่ะ',
              quickReply: ImageQuickReply,
            },
          ],
        });
        return;
      }

      // Define the file name with the correct extension
      const fileName = `${event.message.id}.${fileType}`;

      // Save the image content to the uploads directory
      const filePath = await this.saveToUploadsDir(fileName, imageContent);

      await this.userStatesService.update(user_state.id, {
        state: 'waiting for what meal',
        menuName: candidates,
        pendingFile: { fileName, filePath },
      });

      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'ได้รับรูปเรียบร้อยค่ะ✅ บอกมะลิหน่อยนะคะ ว่าอาหารในรูปเป็นมื้อไหนกดเลือกได้เลยค่ะ',
          },
          WhatMealFlex,
        ],
      });
    } else if (
      event.message.type === 'text' &&
      event.message.text === 'ยกเลิก'
    ) {
      await this.handleCancel(event, user_state.id);
    } else {
      await this.sendReplyTextMessage(userId, 'ยังจะบันทึกอยู่มั้ย');
    }
  }

  async waitingWhatMeal(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    try {
      const userId = this.checkSourceUser(event);

      if (event.message.type === 'text') {
        const messageText = event.message.text;

        if (messageText.includes('ยกเลิก')) {
          await this.handleCancel(event, user_state.id);
          return;
        }

        const filePath = user_state.pendingFile?.filePath;
        if (!filePath) {
          throw new Error(
            'File path not found in user state [ isPredictionCorrect ]',
          );
        }

        const mealResponses = {
          เช้า: 'มะลิบันทึกเป็นอาหารเช้าเรียบร้อยค่า',
          กลางวัน: 'มะลิบันทึกเป็นอาหารกลางวันเรียบร้อยค่า',
          เที่ยง: 'มะลิบันทึกอาหารกลางวันเรียบร้อยค่า',
          เย็น: 'มะลิบันทึกเป็นอาหารเย็นเรียบร้อยค่า',
          ของว่าง: 'มะลิบันทึกเป็นของว่างเรียบร้อยค่า',
        };

        // Check if the message matches any meal keyword
        const response = Object.keys(mealResponses).find((key) =>
          messageText.includes(key),
        );
        // If a match is found, proceed with the prediction
        if (response) {
          const candidates = user_state.menuName;
          if (!candidates) {
            throw new Error(
              'Menu name not found in user state at [waitingWhatMeal]',
            );
          }
          this.logger.debug('Menu name: ', candidates);
          // Send the corresponding reply
          await this.client.pushMessage({
            to: userId,
            messages: [
              {
                type: 'text',
                text:
                  mealResponses[response as keyof typeof mealResponses] ||
                  'Unknown meal response',
              },
              MenuChoiceConfirmFlex(
                candidates.map((candidate) => ({
                  name: candidate.name.join(', '),
                })),
              ),
            ],
          });

          await this.userStatesService.update(user_state.id, {
            state: 'is prediction correct',
          });
          return;
        }
      }
      // Handle other message types (e.g., stickers, images)
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'กรุณาเลือกมื้ออาหารที่ต้องการบันทึก หรือกด "ยกเลิกการบันทึก"',
            quickReply: CancleQuickReply,
          },
        ],
      });
    } catch (error) {
      this.logger.error('Error at [waitingWhatMeal]:', error);
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้งนะคะ',
          },
        ],
      });
    }
  }

  async MenuChoicesConfirm(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    const userId = this.checkSourceUser(event);
    this.logger.debug('Processing prediction confirmation');
    if (event.message.type === 'text') {
      const messageText = event.message.text;
      if (messageText.includes('ยกเลิก')) {
        await this.handleCancel(event, user_state.id);
        return;
      }

      const fileName = user_state.pendingFile?.fileName;
      const filePath = user_state.pendingFile?.filePath;
      if (!filePath) {
        throw new Error(
          'File path not found in user state [ isPredictionCorrect ]',
        );
      }
      if (!fileName) {
        throw new Error(
          'File name not found in user state [ isPredictionCorrect ]',
        );
      }
      // if (messageText.includes('ไม่')) {
      //   await this.userStatesService.update(user_state.id, {
      //     state: 'waiting for menu name',
      //   });
      //   await this.client.pushMessage({
      //     to: userId,
      //     messages: [
      //       {
      //         type: 'text',
      //         text: 'มะลิจะบันทึกอาหารที่ทานในวันนี้เป็นอย่างอื่นค่ะ',
      //       },
      //     ],
      //   });

      //   return;
      // } else {
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
      await this.userStatesService.remove(user_state.id);
      await this.client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'text',
            text: 'โอเคค่ะ มื้อนี้มะลิบันทึกให้เรียบร้อยค่า มาดูเกรดของจานนี้กันดีกว่าค่ะว่าได้เกรดอะไร ⬇️',
          },
        ],
      });

      return;
      // }
    }
    await this.client.pushMessage({
      to: userId,
      messages: [
        {
          type: 'text',
          text: 'ที่ทายมาถูกต้องมั้ยคะ?',
          quickReply: CancleQuickReply,
        },
      ],
    });
    return;
  }

  async recordMeal(
    event: line.MessageEvent,
    user_state: UserState,
  ): Promise<void> {
    const userId = this.checkSourceUser(event);
    if (event.message.type === 'text') {
      const messageText = event.message.text;
      if (messageText.includes('ยกเลิก')) {
        await this.handleCancel(event, user_state.id);
        return;
      }
      await this.client.pushMessage({
        to: userId,
        messages: [
          {
            type: 'text',
            text: 'กรุณาเลือกมื้ออาหารที่ต้องการบันทึก หรือกด "ยกเลิกการบันทึก"',
            quickReply: CancleQuickReply,
          },
        ],
      });
    }
  }
}
