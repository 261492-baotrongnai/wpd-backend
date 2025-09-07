import * as line from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { WhatMealFlex } from './flex/flex-what-meal';
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
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import { MealsService } from 'src/meals/meals.service';
import { MealType } from 'src/meals/entities/meal.entity';
import { FoodsService } from 'src/foods/foods.service';
import { GradeFlex } from './flex/flex-grade';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from '../queue-events/queue-events.service';
import {
  CandidateContents,
  MenuChoiceConfirmFlex,
} from './flex/flex-menu-choice';
import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
// import { UpdateUserStateDto } from 'src/user-states/dto/update-user-state.dto';

@Injectable()
export class RecordCaseHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(RecordCaseHandler.name);
  private readonly s3Client = createS3Client();

  constructor(
    private readonly userService: UsersService,
    private readonly imagesService: ImagesService,
    private readonly api: ExternalApiService,
    private readonly configService: ConfigService,
    private readonly foodGrade: FoodGradesService,
    private readonly mealService: MealsService,
    private readonly foodService: FoodsService,
    @InjectQueue('user-choice-logs') private readonly logsQueue: Queue,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  /**
   * Move image from Space 'meal_images/waitings/[fileName]' to 'meal_images/[user_id]/[fileName]'
   * and delete the original in 'waitings'.
   */
  async moveImageFromWaitingToUser(
    user_id: number,
    fileName: string,
  ): Promise<string> {
    const sourceKey = `meal_images/waitings/${fileName}`;
    const destKey = `meal_images/${user_id}/${fileName}`;
    try {
      // Copy object
      await this.s3Client.copyObject({
        Bucket: process.env.SPACE_NAME,
        CopySource: `${process.env.SPACE_NAME}/${sourceKey}`,
        Key: destKey,
        ACL: 'private',
      });
      // Delete original
      await this.s3Client.deleteObject({
        Bucket: process.env.SPACE_NAME,
        Key: sourceKey,
      });
      this.logger.log(`Moved image from ${sourceKey} to ${destKey}`);
      return destKey;
    } catch (error) {
      this.logger.error(`Error moving image from waiting to user:`, error);
      throw new Error(
        `Error moving image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private checkSourceUser(event: line.MessageEvent): string {
    if (event.source.type !== 'user') {
      throw new Error('Event source is not user type');
    }
    return event.source.userId;
  }

  private async sendPushTextMessage(
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
    const removeJob = await this.userStateQueue.add(
      'remove-user-state',
      userStateId,
    );
    await this.queueEventsRegistryService.waitForJobResult(
      removeJob,
      this.userStateQueue,
    );
    return;
  }

  private async handleCancel(
    event: line.MessageEvent,
    userStateId: number,
  ): Promise<void> {
    await this.client.replyMessage({
      replyToken: event.replyToken || '',
      messages: [{ type: 'text', text: 'ยกเลิกการบันทึกอาหาร' }],
    });
    await this.removeUserState(userStateId);
    return;
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
    try {
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
      return;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error uploading file: ${error.message}`,
          error.stack,
        );
        throw new Error(`Error uploading file: ${error.message}`);
      } else {
        this.logger.error('Error uploading file: Unknown error', error);
        throw new Error('Error uploading file: Unknown error');
      }
    }
  }

  async postToSpaceWithoutLocal(
    user_id: number,
    file_name: string,
    image_content: Buffer,
    file_type: string,
  ): Promise<void> {
    // Upload the image directly to the Space bucket without saving locally
    const key = `meal_images/waitings/${file_name}`;
    try {
      const uploadParams = {
        Bucket: process.env.SPACE_NAME,
        Key: key,
        Body: image_content,
        ContentType: `image/${file_type}`,
        ACL: 'private' as ObjectCannedACL,
      };
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });
      await parallelUpload.done();
      this.logger.log(
        `File uploaded directly to Space: ${file_name} for user ${user_id}`,
      );
    } catch (error) {
      this.logger.error(`Error uploading file to Space:`, error);
      throw new Error(
        `Error uploading file to Space: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async waitingMealImage(
    event: line.MessageEvent,
    user_state: UserState,
    user_id: string,
  ): Promise<string> {
    // const userId = this.checkSourceUser(event);
    try {
      if (event.message.type === 'image') {
        // Fetch the image content and file type
        const { buffer: imageContent, fileType } = await this.getMessageContent(
          event.message.id,
        );

        const response = await this.api.getMenuCandidates(undefined, {
          buffer: imageContent,
          mimeType: `image/${fileType}`,
        });
        this.logger.debug('Menu name: ', response);
        if (!response.isFood) {
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
          return 'Waiting Meal Image Not Food';
        }

        // Define the file name with the correct extension
        const fileName = `${event.message.id}.${fileType}`;

        // Post the image content directly to Space (no local save)
        const key = `meal_images/waitings/${fileName}`;
        await this.postToSpaceWithoutLocal(
          user_state.user.id,
          fileName,
          imageContent,
          fileType,
        );
        const filePath = key; // Use Space key as filePath reference

        const updateJob = await this.userStateQueue.add('update-user-state', {
          id: user_state.id,
          updateUserStateDto: {
            state: 'waiting for what meal',
            menuName: response.candidates,
            pendingFile: { fileName, filePath },
            geminiImageName: response.geminiImageName,
            lineUserId: user_id,
          },
        });

        await this.queueEventsRegistryService.waitForJobResult(
          updateJob,
          this.userStateQueue,
        );

        try {
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
        } catch (error) {
          this.logger.error('Error replying to user:', error);
          await this.client.pushMessage({
            to: user_id,
            messages: [
              {
                type: 'text',
                text: 'ได้รับรูปเรียบร้อยค่ะ✅ บอกมะลิหน่อยนะคะ ว่าอาหารในรูปเป็นมื้อไหนกดเลือกได้เลยค่ะ',
              },
              WhatMealFlex,
            ],
          });
        }
        return 'Waiting Meal Image Completed';
      } else if (
        event.message.type === 'text' &&
        event.message.text === 'ยกเลิก'
      ) {
        await this.handleCancel(event, user_state.id);
        return 'Waiting Meal Image Cancelled';
      } else {
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'กรุณาส่งรูปอาหารที่ต้องการบันทึก หรือกด "ยกเลิกการบันทึก"',
              quickReply: ImageQuickReply,
            },
          ],
        });
        return 'Waiting Meal Image Failed';
      }
    } catch (error) {
      this.logger.error('Error at [waitingMealImage]:', error);
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้งนะคะ',
            quickReply: ImageQuickReply,
          },
        ],
      });
      throw new Error(
        `Error at [waitingMealImage]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async waitingWhatMeal(
    event: line.MessageEvent,
    user_state: UserState,
    user_id: string,
  ): Promise<string> {
    try {
      // const userId = this.checkSourceUser(event);

      if (event.message.type === 'text') {
        const messageText = event.message.text;

        if (messageText.includes('ยกเลิก')) {
          await this.handleCancel(event, user_state.id);
          return 'Waiting What Meal Cancelled';
        }

        const filePath = user_state.pendingFile?.filePath;
        if (!filePath) {
          throw new Error(
            'File path not found in user state [ isPredictionCorrect ]',
          );
        }

        const mealResponses = {
          เช้า: {
            resp: 'มะลิบันทึกเป็นอาหารเช้าเรียบร้อยค่า',
            mealType: 'breakfast',
          },
          กลางวัน: {
            resp: 'มะลิบันทึกเป็นอาหารกลางวันเรียบร้อยค่า',
            mealType: 'lunch',
          },
          เที่ยง: {
            resp: 'มะลิบันทึกเป็นอาหารเที่ยงเรียบร้อยค่า',
            mealType: 'lunch',
          },
          เย็น: {
            resp: 'มะลิบันทึกเป็นอาหารเย็นเรียบร้อยค่า',
            mealType: 'dinner',
          },
          ของว่าง: {
            resp: 'มะลิบันทึกเป็นของว่างเรียบร้อยค่า',
            mealType: 'snack',
          },
        };

        // Check if the message matches any meal keyword
        const response = Object.keys(mealResponses).find((key) =>
          messageText.includes(key),
        );

        this.logger.debug('Response:', response);
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
          try {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text:
                    mealResponses[response as keyof typeof mealResponses]
                      .resp || 'Unknown meal response',
                },
                MenuChoiceConfirmFlex(
                  CandidateContents(
                    candidates.map((candidate) => ({
                      name: candidate.name.join(', '),
                    })),
                  ),
                ),
              ],
            });
          } catch (error) {
            this.logger.error('Error at [waitingWhatMeal]:', error);
            await this.client.pushMessage({
              to: user_id,
              messages: [
                {
                  type: 'text',
                  text:
                    mealResponses[response as keyof typeof mealResponses]
                      .resp || 'Unknown meal response',
                },
                MenuChoiceConfirmFlex(
                  CandidateContents(
                    candidates.map((candidate) => ({
                      name: candidate.name.join(', '),
                    })),
                  ),
                ),
              ],
            });
          }

          const updateJob = await this.userStateQueue.add('update-user-state', {
            id: user_state.id,
            updateUserStateDto: {
              state: 'is prediction correct',
              mealType: mealResponses[response as keyof typeof mealResponses]
                .mealType as MealType,
              menuName: candidates,
              geminiImageName: user_state.geminiImageName,
            },
          });

          try {
            await this.queueEventsRegistryService.waitForJobResult(
              updateJob,
              this.userStateQueue,
            );
          } catch (error) {
            this.logger.error(
              'Error waiting for update user state job result:',
              error instanceof Error ? error.message : String(error),
            );
          }

          return `Waiting What Meal Completed`;
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
      return 'Waiting What Meal Failed';
    } catch (error) {
      this.logger.error('Error at [waitingWhatMeal]:', error);
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้งนะคะ',
            quickReply: CancleQuickReply,
          },
        ],
      });
      throw new Error(
        `Error at [waitingWhatMeal]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  gradingByAIMenu(
    foods: {
      name: string;
      grade: FoodGradeType;
      description: string;
      grading_by_ai: boolean;
    }[],
  ): string[] {
    return foods
      .filter((food) => food.grading_by_ai)
      .map((food) => `${food.name}`);
  }

  async MenuChoicesConfirm(
    event: line.MessageEvent,
    user_state: UserState,
    user_id: string,
  ): Promise<string> {
    // const userId = this.checkSourceUser(event);
    try {
      this.logger.debug('Processing prediction confirmation');
      if (
        event.message.type === 'text' &&
        event.message.text !== 'บันทึกอาหารที่ทาน' &&
        event.message.text !== 'กินได้ก่อ' &&
        event.message.text !== 'วิธีใช้' &&
        !['มื้อเย็น☁️', 'มื้อเที่ยง☀️', 'มื้อเช้า⛅️', 'ของว่าง🍉🧃'].includes(
          event.message.text,
        )
      ) {
        const messageText = event.message.text;
        if (messageText.includes('ยกเลิก')) {
          await this.handleCancel(event, user_state.id);
          return 'MenuChoicesConfirm Cancelled';
        }

        // Parse the messageText into a string array
        const parsedMenuNames = messageText
          .split(/[, ]+/) // Split by comma or space (one or more)
          .map((name) => name.trim()) // Remove extra whitespace
          .filter((name) => name.length > 0); // Remove empty strings
        this.logger.debug('Parsed menu names:', parsedMenuNames);

        // get the lowest grade, max score, average grade and score from the foodGrade service
        const { lowestGrade, maxScore, avgGrade, avgScore, foods } =
          await this.foodGrade.getMenuGrade(
            parsedMenuNames,
            user_state.geminiImageName,
          );

        const ai_grading_menus = this.gradingByAIMenu(foods);

        if (!avgGrade || !avgScore) {
          await this.client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: 'ชื่อที่ส่งมาอาจจะไม่ใช่ชื่ออาหาร หรือไม่สามารถประมวลผลได้ค่ะ กรุณาลองใหม่อีกครั้งนะคะ',
              },
            ],
          });
          return 'MenuChoicesConfirm Not Food';
        }
        let GradeResult: line.messagingApi.FlexMessage;
        // switch (lowestGrade) {
        switch (avgGrade) {
          case 'A':
            GradeResult = GradeFlex('A', messageText, ai_grading_menus);

            break;
          case 'B':
            GradeResult = GradeFlex('B', messageText, ai_grading_menus);

            break;
          case 'C':
            GradeResult = GradeFlex('C', messageText, ai_grading_menus);
            break;
        }

        const fileName = user_state.pendingFile?.fileName;
        if (!fileName) {
          throw new Error(
            'File name not found in user state [ isPredictionCorrect ]',
          );
        }
        // Move image from waitings to user folder in Space
        const filePath = await this.moveImageFromWaitingToUser(
          user_state.user.id,
          fileName,
        );

        // log user choice
        await this.logsQueue.add(
          'user-choice-logs',
          {
            userId: user_state.user.id,
            candidates: user_state.menuName,
            selected: parsedMenuNames,
            filePath: filePath,
          },
          {
            removeOnComplete: false, // Keep this job forever
          },
        );

        await this.imagesService.create({
          name: fileName,
          user: user_state.user,
        });
        this.logger.debug('mealType:', user_state.mealType);
        const meal = await this.mealService.create({
          user: user_state.user,
          mealType: user_state.mealType,
          imageName: fileName,
          avgGrade,
          avgScore,
          maxScore,
          lowestGrade,
        });
        for (const food of foods) {
          await this.foodService.create({
            name: food.name,
            grade: food.grade,
            description: food.description,
            meal,
            grading_by_ai: food.grading_by_ai,
          });
        }

        const removeJob = await this.userStateQueue.add(
          'remove-user-state',
          user_state.id,
        );

        await this.queueEventsRegistryService.waitForJobResult(
          removeJob,
          this.userStateQueue,
        );

        this.logger.debug(`User state removed: ${user_state.id}`);

        try {
          await this.client.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: `โอเคค่ะ มื้อนี้มะลิบันทึกให้เรียบร้อยค่า มาดูเกรดของจานนี้กันดีกว่าค่ะว่าได้เกรดอะไร ⬇️ `,
              },
              GradeResult,
            ],
          });
        } catch (error) {
          this.logger.error(
            'Error replying to user at [record-case.ts/MenuChoicesConfirm]:',
            error,
          );
          await this.client.pushMessage({
            to: user_id,
            messages: [
              {
                type: 'text',
                text: `โอเคค่ะ มื้อนี้มะลิบันทึกให้เรียบร้อยค่า มาดูเกรดของจานนี้กันดีกว่าค่ะว่าได้เกรดอะไร ⬇️ `,
              },
              GradeResult,
            ],
          });
        }

        return 'MenuChoicesConfirm Completed';
      }
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'กรุณาเลือกหรือพิมพ์เมนูอาหารที่ต้องการบันทึก หรือกด "ยกเลิกการบันทึก"',
            quickReply: CancleQuickReply,
          },
        ],
      });
      return 'MenuChoicesConfirm Failed';
    } catch (error) {
      this.logger.error('Error at [MenuChoicesConfirm]:', error);
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้งนะคะ',
            quickReply: CancleQuickReply,
          },
        ],
      });
      throw new Error(
        `Error at [MenuChoicesConfirm]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
