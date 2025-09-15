import * as line from '@line/bot-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { RecordCaseHandler } from './record-case';
import { ExternalApiService } from 'src/external-api/external-api.service';
import { FoodGradesService } from 'src/food-grades/food-grades.service';
import {
  canEatCheckImageQuickReply,
  CancleQuickReply,
  DecideToRecordQuickReply,
} from './quick-reply';
import {
  CandidateContents,
  MenuChoiceConfirmFlex,
} from './flex/flex-menu-choice';
import { MealsService } from 'src/meals/meals.service';
import { FoodGradeType } from 'src/food-grades/entities/food-grade.entity';
import { canEatCheckSummary, RecordOrNot } from './flex/flex-decideToEat';
import { WhatMealFlex } from './flex/flex-message';
import { MealType } from 'src/meals/entities/meal.entity';
import { ImagesService } from 'src/images/images.service';
import { FoodsService } from 'src/foods/foods.service';
import { GradingFlex } from './flex/flex-grade';

@Injectable()
export class CanEatCheckHandler {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(CanEatCheckHandler.name);

  constructor(
    private readonly recordCaseHandler: RecordCaseHandler,
    private readonly externalApi: ExternalApiService,
    private readonly foodGrade: FoodGradesService,

    private readonly foodsService: FoodsService,
    private readonly mealsService: MealsService,
    private readonly imagesService: ImagesService,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,

    @InjectQueue('user-choice-logs') private readonly logsQueue: Queue,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
    @InjectQueue('canEatCheck-user-decide')
    private readonly userDecideQueue: Queue,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  private calculateStatIfDecidedToEat(
    todaySummary: {
      avgScore: number;
      avgGrade: string;
      totalMeal: number;
      countA: number;
      countB: number;
      countC: number;
      totalFood: number;
    },
    askMenuInfo: {
      lowestGrade: FoodGradeType;
      maxScore: number;
      avgGrade: FoodGradeType;
      avgScore: number;
      foods: Array<{
        name: string;
        grade: FoodGradeType;
        description: string;
        grading_by_ai: boolean;
      }>;
    },
    menuLists: string[],
  ): { newScore: number; newGrade: string } {
    let newScore = 0;
    let newGrade = '';

    if (todaySummary.totalFood > 0) {
      const todayTotalScore = todaySummary.avgScore * todaySummary.totalFood;
      const askedTotalScore = askMenuInfo.avgScore * menuLists.length;
      const foodAmount = todaySummary.totalFood + menuLists.length;
      newScore = (todayTotalScore + askedTotalScore) / foodAmount;
      newGrade = this.foodGrade.scoreToGrade(newScore);
    } else {
      newScore = askMenuInfo.avgScore;
      newGrade = askMenuInfo.avgGrade;
    }

    return { newScore, newGrade };
  }

  async handleCancel(
    event: line.MessageEvent,
    userStateId: number,
  ): Promise<void> {
    await this.client.replyMessage({
      replyToken: event.replyToken || '',
      messages: [{ type: 'text', text: 'ยกเลิกกินได้ก่อ' }],
    });
    await this.removeUserState(userStateId);
    return;
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

  private async handleErrorReplyMessage(
    event: line.MessageEvent,
    text: string,
    quickReply: line.messagingApi.QuickReply,
  ): Promise<void> {
    await this.client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: text,
          quickReply: quickReply,
        },
      ],
    });
  }

  private async handleOtherMessageOfConfirmToRecord(replyToken: string) {
    await this.client.replyMessage({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: `กรุณาเลือก บันทึกอาหาร หรือ ไม่บันทึกอาหาร ค่ะ`,
          quickReply: DecideToRecordQuickReply,
        },
      ],
    });
  }

  private async logUserDecision(isRecord: boolean, userState: UserState) {
    const todaySummary = await this.mealsService.getTodaySummary(
      userState.user.id,
    );
    await this.userDecideQueue.add(
      'canEatCheck-user-decide',
      {
        userId: userState.user.id,
        todayAvgScore: todaySummary.avgScore,
        askedMenu: userState.foodGradingInfo,
        fileName: userState.pendingFile?.fileName,
        isRecord: isRecord,
      },
      {
        removeOnComplete: false,
      },
    );
  }

  private handleIsFirstMeal(
    lineMessage: string,
    todaySummary: {
      avgScore: number;
      avgGrade: string;
      totalMeal: number;
      countA: number;
      countB: number;
      countC: number;
      totalFood: number;
    },
    foodGradingInfo: {
      lowestGrade: FoodGradeType;
      maxScore: number;
      avgGrade: FoodGradeType;
      avgScore: number;
      foods: Array<{
        name: string;
        grade: FoodGradeType;
        description: string;
        grading_by_ai: boolean;
      }>;
    },
    newGrade: string,
    newScore: number,
  ): line.messagingApi.FlexMessage {
    if (todaySummary.totalFood > 0) {
      return canEatCheckSummary(
        lineMessage,
        todaySummary.avgGrade,
        foodGradingInfo.avgGrade,
        newGrade,
        todaySummary.avgScore,
        newScore,
      );
    } else {
      return canEatCheckSummary(
        lineMessage,
        foodGradingInfo.avgGrade,
        foodGradingInfo.avgGrade,
        newGrade,
        foodGradingInfo.avgScore,
        newScore,
      );
    }
  }

  async waitingForFoodImage(
    event: line.MessageEvent,
    userState: UserState,
    lineUserId: string,
  ): Promise<string> {
    try {
      if (event.message.type === 'image') {
        const { buffer: imageContent, fileType } =
          await this.recordCaseHandler.getMessageContent(event.message.id);

        const response = await this.externalApi.getMenuCandidates(undefined, {
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
                quickReply: canEatCheckImageQuickReply,
              },
            ],
          });
          return 'Waiting Meal Image Not Food';
        }

        // Define the file name with the correct extension
        const fileName = `${event.message.id}.${fileType}`;

        await this.recordCaseHandler.postToSpaceWithoutLocal(
          userState.user.id,
          fileName,
          imageContent,
          fileType,
        );
        const spaceFilePath = `meal_images/waitings/${fileName}`;

        const candidates = response.candidates;
        // const candidates = [
        //   {
        //     name: ['ก๋วยจั๊บน้ำข้น'],
        //   },
        //   {
        //     name: ['ก๋วยจั๊บ', 'หมูกรอบ'],
        //   },
        //   {
        //     name: ['ก๋วยจั๊บ', 'ไข่ต้ม'],
        //   },
        //   {
        //     name: ['ก๋วยจั๊บ'],
        //   },
        // ];
        const updateJob = await this.userStateQueue.add('update-user-state', {
          id: userState.id,
          updateUserStateDto: {
            state: 'canEatCheck: waiting for menu names',
            menuName: response.candidates,
            pendingFile: { fileName, filePath: spaceFilePath },
            geminiImageName: response.geminiImageName,
            lineUserId: lineUserId,
          },
          //   updateUserStateDto: {
          //     state: 'canEatCheck: waiting for menu names',
          //     menuName: candidates,
          //     pendingFile: '',
          //     geminiImageName: '',
          //     lineUserId: lineUserId,
          //   },
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
                text: 'ได้รับรูปเรียบร้อยค่ะ✅ บอกมะลิหน่อยนะคะ ว่าอาหารในรูปชื่อเมนูว่าอะไร',
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
            to: lineUserId,
            messages: [
              {
                type: 'text',
                text: 'ได้รับรูปเรียบร้อยค่ะ✅ บอกมะลิหน่อยนะคะ ว่าอาหารในรูปชื่อเมนูว่าอะไร',
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

        return 'canEatCheck: Waiting Meal Image Completed';
      } else if (
        event.message.type === 'text' &&
        event.message.text === 'ยกเลิก'
      ) {
        await this.handleCancel(event, userState.id);
        return 'canEatCheck: Waiting Meal Image Cancelled';
      } else {
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'กรุณาส่งรูปอาหารที่ต้องการถาม หรือกด "ยกเลิกกินได้ก่อ"',
              quickReply: canEatCheckImageQuickReply,
            },
          ],
        });
        return 'canEatCheck: Waiting Meal Image Failed';
      }
    } catch (error) {
      this.logger.error('Error at [canEatCheck: waitingMealImage]:', error);
      await this.handleErrorReplyMessage(
        event,
        'กรุณาส่งรูปอาหารที่ต้องการถาม หรือกด "ยกเลิก"',
        canEatCheckImageQuickReply,
      );
      throw new Error(
        `Error at [canEatCheck: waitingMealImage]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async confirmMenuName(
    event: line.MessageEvent,
    userState: UserState,
    lineUserId: string,
  ): Promise<string> {
    try {
      if (
        event.message.type === 'text' &&
        event.message.text !== 'บันทึกอาหารที่ทาน' &&
        event.message.text !== 'กินได้ก่อ' &&
        event.message.text !== 'วิธีใช้' &&
        event.message.text !== 'ไม่บันทึกเมนูนี้' &&
        event.message.text !== 'บันทึกเมนูนี้'
      ) {
        if (event.message.text.includes('ยกเลิก')) {
          await this.handleCancel(event, userState.id);
          return 'MenuChoicesConfirm Cancelled';
        } else {
          const lineMessage = event.message.text;
          const parsedMenuNames =
            this.recordCaseHandler.parseMessageText(lineMessage);

          const foodGradingInfo = await this.foodGrade.getMenuGrade(
            parsedMenuNames,
            userState.geminiImageName,
          );

          console.log('grading info', foodGradingInfo);

          if (!foodGradingInfo.avgGrade || !foodGradingInfo.avgScore) {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: 'ชื่อที่ส่งมาอาจจะไม่ใช่ชื่ออาหาร หรือไม่สามารถประมวลผลได้ค่ะ กรุณาลองใหม่อีกครั้งนะคะ',
                },
              ],
            });
            return 'canEatCheck: confirmMenuName Not Food';
          }

          const todaySummary = await this.mealsService.getTodaySummary(
            userState.user.id,
          );

          this.logger.log('todaySummary: ', todaySummary);

          const { newScore, newGrade } = this.calculateStatIfDecidedToEat(
            todaySummary,
            foodGradingInfo,
            parsedMenuNames,
          );

          // log user choice
          await this.logsQueue.add(
            'user-choice-logs',
            {
              userId: userState.user.id,
              candidates: userState.menuName,
              selected: parsedMenuNames,
              filePath: userState.pendingFile,
            },
            {
              removeOnComplete: false,
            },
          );

          // update user state
          const updateJob = await this.userStateQueue.add('update-user-state', {
            id: userState.id,
            updateUserStateDto: {
              state: 'canEatCheck: waiting for decide confirm',
              menuName: userState.menuName,
              pendingFile: userState.pendingFile,
              geminiImageName: userState.geminiImageName,
              lineUserId: lineUserId,
              foodGradingInfo: JSON.stringify(foodGradingInfo),
            },
          });

          await this.queueEventsRegistryService.waitForJobResult(
            updateJob,
            this.userStateQueue,
          );

          // reply user here
          try {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                this.handleIsFirstMeal(
                  lineMessage,
                  todaySummary,
                  foodGradingInfo,
                  newGrade,
                  newScore,
                ),
                RecordOrNot(),
              ],
            });
          } catch (error) {
            this.logger.error(
              'Error replying to user at [canEatCheck: decideToEatConfirmFlex]:',
              error,
            );
            await this.client.pushMessage({
              to: lineUserId,
              messages: [
                {
                  type: 'text',
                  text: `ขออภัยค่ะ เกิดข้อผิดพลาดกรุณาเลือก บันทึกอาหาร หรือ ไม่บันทึกอาหาร อีกครั้งนะคะ`,
                  quickReply: DecideToRecordQuickReply,
                },
              ],
            });
          }

          return 'canEatCheck: confirmMenuName Completed';
        }
      } else {
        await this.client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'text',
              text: 'กรุณาเลือกหรือพิมพ์เมนูอาหารที่ต้องการถาม หรือกด "ยกเลิก"',

              quickReply: CancleQuickReply,
            },
          ],
        });

        return 'canEatCheck: confirmMenuName Failed';
      }
    } catch (error) {
      this.logger.error('Error at [canEatCheck: confirmMenuName]:', error);
      await this.handleErrorReplyMessage(
        event,
        'กรุณาเลือกหรือพิมพ์เมนูอาหารที่ต้องการถาม หรือกด "ยกเลิก"',
        CancleQuickReply,
      );
      throw new Error(
        `Error at [canEatCheck: confirmMenuName]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async confirmToRecordMenu(
    event: line.MessageEvent,
    userState: UserState,
    lineUserId: string,
  ): Promise<string> {
    try {
      if (event.message.type === 'text') {
        if (event.message.text === 'ไม่บันทึกเมนูนี้') {
          //log to redis and delete user state here

          // log user decision
          await this.logUserDecision(false, userState);

          // delete user state
          await this.removeUserState(userState.id);

          try {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: 'เรียบร้อยค่า เมนูนี้มะลิไม่ได้บันทึกนะคะ',
                },
              ],
            });
          } catch (error) {
            await this.client.pushMessage({
              to: lineUserId,
              messages: [
                {
                  type: 'text',
                  text: 'กรุณาเลือกหรือพิมพ์เมนูอาหารที่ต้องการถาม หรือกด "ยกเลิก"',

                  quickReply: CancleQuickReply,
                },
              ],
            });
          }

          return 'canEatCheck: confirm to record completed with not record';
        } else if (event.message.text === 'บันทึกเมนูนี้') {
          //log to redis, update user state,  ask for the meal here

          // log user decision
          await this.logUserDecision(true, userState);

          // update user state
          const updateJob = await this.userStateQueue.add('update-user-state', {
            id: userState.id,
            updateUserStateDto: {
              state: 'canEatCheck: waiting for meal type',
            },
          });

          await this.queueEventsRegistryService.waitForJobResult(
            updateJob,
            this.userStateQueue,
          );

          // ask for what meal flex
          try {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: 'บอกมะลิหน่อยนะคะ ว่าอาหารในรูปเป็นมื้อไหนกดเลือกได้เลยค่ะ',
                },
                WhatMealFlex,
              ],
            });
          } catch (error) {
            this.logger.error('Error replying to user:', error);
            await this.client.pushMessage({
              to: lineUserId,
              messages: [
                {
                  type: 'text',
                  text: 'บอกมะลิหน่อยนะคะ ว่าอาหารในรูปเป็นมื้อไหนกดเลือกได้เลยค่ะ',
                },
                WhatMealFlex,
              ],
            });
          }

          return 'canEatCheck: confirm to record completed with record meal';
        } else {
          await this.handleOtherMessageOfConfirmToRecord(event.replyToken);
          return 'canEatCheck: confirm to record failed';
        }
      } else {
        await this.handleOtherMessageOfConfirmToRecord(event.replyToken);
        return 'canEatCheck: confirm to record failed';
      }
    } catch (error) {
      this.logger.error('Error at [canEatCheck: confirmToRecordMenu]:', error);
      await this.handleErrorReplyMessage(
        event,
        `เกิดข้อผิดพลาดกรุณาเลือก บันทึกอาหาร หรือ ไม่บันทึกอาหาร อีกครั้งค่ะ`,
        DecideToRecordQuickReply,
      );
      throw new Error(
        `Error at [canEatCheck: confirmToRecordMenu]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async confirmMealToRecord(
    event: line.MessageEvent,
    userState: UserState,
    lineUserId: string,
  ): Promise<string> {
    try {
      if (event.message.type === 'text') {
        const lineMessage = event.message.text;
        const filePath = userState.pendingFile?.filePath;
        const fileName = userState.pendingFile?.fileName;
        const foodInfo = userState.foodGradingInfo;

        if (lineMessage.includes('ยกเลิก')) {
          await this.handleCancel(event, userState.id);

          return 'canEatCheck: confirmMealToRecord completed with cancle';
        }

        if (!filePath) {
          throw new Error('File path not found in confirmMealToRecord');
        }

        if (!fileName) {
          throw new Error('File Name not found in confirmMealToRecord');
        }

        if (!foodInfo) {
          throw new Error(
            'Food grading infomation not found in confirmMealToRecord',
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
          lineMessage.includes(key),
        );

        if (response) {
          const jsonFoodInfo: {
            lowestGrade: FoodGradeType;
            maxScore: number;
            avgGrade: FoodGradeType;
            avgScore: number;
            foods: Array<{
              name: string;
              grade: FoodGradeType;
              description: string;
              grading_by_ai: boolean;
            }>;
          } = JSON.parse(foodInfo);

          const filePath =
            await this.recordCaseHandler.moveImageFromWaitingToUser(
              userState.user.id,
              fileName,
            );

          const mealType = mealResponses[response as keyof typeof mealResponses]
            .mealType as MealType;

          this.logger.debug('mealType:', mealType);

          await this.imagesService.create({
            name: fileName,
            user: userState.user,
          });

          const meal = await this.mealsService.create({
            user: userState.user,
            mealType: mealType,
            imageName: fileName,
            avgGrade: jsonFoodInfo.avgGrade,
            avgScore: jsonFoodInfo.avgScore,
            maxScore: jsonFoodInfo.maxScore,
            lowestGrade: jsonFoodInfo.lowestGrade,
          });

          for (const food of jsonFoodInfo.foods) {
            await this.foodsService.create({
              name: food.name,
              grade: food.grade,
              description: food.description,
              meal,
              grading_by_ai: food.grading_by_ai,
            });
          }

          const removeJob = await this.userStateQueue.add(
            'remove-user-state',
            userState.id,
          );

          await this.queueEventsRegistryService.waitForJobResult(
            removeJob,
            this.userStateQueue,
          );

          this.logger.debug(`User state removed: ${userState.id}`);

          let GradeResult: line.messagingApi.FlexMessage;
          const isAiGrading = this.recordCaseHandler.gradingByAIMenu(
            jsonFoodInfo.foods,
          );
          const foodNames = jsonFoodInfo.foods
            .map((food) => food.name)
            .join(', ');

          try {
            await this.client.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'text',
                  text: `โอเคค่ะ มื้อนี้มะลิบันทึกให้เรียบร้อยค่า`,
                },
                GradingFlex(jsonFoodInfo.avgGrade, foodNames),
              ],
            });
          } catch (error) {
            this.logger.error(
              'Error replying to user at [record-case.ts/MenuChoicesConfirm]:',
              error,
            );
            await this.client.pushMessage({
              to: lineUserId,
              messages: [
                {
                  type: 'text',
                  text: `โอเคค่ะ มื้อนี้มะลิบันทึกให้เรียบร้อยค่า`,
                },
                GradingFlex(jsonFoodInfo.avgGrade, foodNames),
              ],
            });
          }

          return 'canEatCheck: confirmMealToRecord completed';
        }
      }

      const replyText =
        'กรุณาเลือกมื้ออาหารที่ต้องการบันทึก หรือกด "ยกเลิกการบันทึก"';

      await this.handleErrorReplyMessage(event, replyText, CancleQuickReply);

      return 'canEatCheck: confirmMealToRecord failed';
    } catch (error) {
      this.logger.error('Error at [canEatCheck: confirmMealToRecord]:', error);

      await this.handleErrorReplyMessage(
        event,
        'เกิดข้อผิดพลาดกรุณา เลือกมื้ออาหาร หรือ "กดยกเลิก" ค่ะ',
        CancleQuickReply,
      );

      throw new Error(
        `Error at [canEatCheck: confirmMealToRecord]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
