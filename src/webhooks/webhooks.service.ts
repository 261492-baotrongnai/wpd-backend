import { Injectable, Logger } from '@nestjs/common';
import {
  AskForImageFlex,
  ClassifyFlex,
  GreetingFlex,
} from './flex/flex-message';
import * as line from '@line/bot-sdk';
import { UsersService } from 'src/users/users.service';
import { getInternalId } from 'src/users/user-utility';
import axios from 'axios';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { RecordCaseHandler } from './record-case';
import { RegistConfirmFlex } from 'src/users/user-flex';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from '../queue-events/queue-events.service';
import { OutOfCaseFlex } from './flex/flex-no-case';
import { ProgramUserFlex } from './flex/flex-program-user';
import { CommonUserFlex } from './flex/flex-common-user';
@Injectable()
export class WebhooksService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksService.name);

  // Initialize LINE SDK client and import user service
  constructor(
    private readonly userService: UsersService,
    private readonly recordCaseHandler: RecordCaseHandler,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  async processEvents(events: line.WebhookEvent[]): Promise<string> {
    let result = 'No result';
    for (const event of events) {
      try {
        this.logger.debug('Processing event:', event);

        if (event.source.type !== 'user') {
          this.logger.warn(
            'Received event from non-user source type:',
            event.source.type,
          );
          continue;
        }

        await this.loading(event.source.userId);
        const uid = event.source.userId;
        if (event.type === 'message') {
          // check if user has any waiting state before processing the message
          const user_states = await this.checkUserState(uid);
          // this log not processed after await checkUserState
          this.logger.debug('User states: ', user_states);
          // if there no waiting state, process the message normally
          if (user_states === null) {
            if (event.message?.type === 'text') {
              if (uid && (await this.isUserExist(uid)) === true) {
                result = 'Out of case';
                switch (event.message.text) {
                  case 'ยันยันการบันทึกผู้ใช้':
                    this.logger.debug('User requested to confirm registration');
                    await this.handleConfirmRegistration(event.replyToken, uid);
                    result = 'Registration confirmed';
                    break;
                  case 'ยันยันการแก้ไขโค้ด':
                    this.logger.debug('User requested to confirm code change');
                    await this.handleConfirmCodeChange(event.replyToken, uid);
                    result = 'Code change confirmed';
                    break;
                  case 'บันทึกอาหารที่ทาน':
                    this.logger.debug('User requested to record meal:');
                    result = await this.handleMealRecord(event.replyToken, uid);
                    break;
                  case 'โปสเตอร์บันทึกอาหาร':
                    this.logger.debug(
                      'User requested to add meal record poster:',
                    );
                    result = await this.handleMealRecordPoster(
                      event.replyToken,
                      uid,
                    );
                    break;
                }
              } else {
                this.logger.warn(
                  'Received message from non-registered user, message:',
                  event.message.text,
                );
                await this.handleNonRegisteredUser(event.replyToken, uid);
                result = 'Non-registered user handled';
              }
            }
          } else {
            this.logger.log('handle waiting state');
            const datePosterState = user_states.find(
              (state) => state.state === 'date-poster',
            );
            if (
              datePosterState &&
              event.message?.type === 'text' &&
              event.message.text === 'โปสเตอร์บันทึกอาหาร'
            ) {
              this.logger.debug(
                'User has date poster state, sending poster:',
                datePosterState.pendingFile?.filePath,
              );
              result = await this.handleMealRecordPoster(event.replyToken, uid);
            } else {
              for (const user_state of user_states) {
                result = await this.handleWaitingState(event, user_state);
              }
            }
          }
        } else if (event.type === 'follow') {
          await this.handleFollowEvent(event.replyToken);
          result = 'Follow event handled';
        } else {
          this.logger.warn(`Unsupported event type: ${event.type}`);
          throw new Error(`Unsupported event type: ${event.type}`);
        }
        if (result === 'No result' || result === 'Out of case') {
          await this.handleOutOfCase(event.replyToken);
          this.logger.debug('Handled out of case for event:', event);
        }
      } catch (error) {
        this.logger.error(
          `Error processing event: ${JSON.stringify(event)}`,
          error,
        );
        throw error;
      }
    }

    return result;
  }

  async checkUserState(uid: string): Promise<UserState[] | null> {
    const iid = await getInternalId(undefined, uid);
    const user = await this.userService.findUserByInternalId(iid);
    this.logger.debug(`CheckUserState - User found: ${user?.id}`);
    if (!user) {
      this.logger.error('User not found or no states in checkUserState');
      return null;
    } else if (user.states.length === 0) {
      this.logger.debug('No user states found, returning null');
      return null;
    } else {
      try {
        // const result = {
        //   user: { id: user.id, internalId: user.internalId },
        //   states: user.states,
        // };
        user.states.forEach((state) => {
          state.user = user;
        });
        return user.states;
      } catch (err) {
        this.logger.error('Error waiting for user state job result:', err);
        throw err;
      }
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

  async handleOutOfCase(replyToken: string) {
    try {
      await this.client.replyMessage({
        replyToken,
        messages: [OutOfCaseFlex],
      });
      console.log('Out of case message sent successfully');
    } catch (error) {
      console.error('Error handling out of case:', error);
      throw error;
    }
  }

  async handleFollowEvent(replyToken: string) {
    try {
      // Send a greeting flex messages
      await this.client.replyMessage({
        replyToken,
        messages: [GreetingFlex, ClassifyFlex()],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error handling follow event:', error);
      throw error;
    }
  }

  async handleConfirmRegistration(replyToken: string, uid: string) {
    try {
      const iid = await getInternalId(undefined, uid);
      const user = await this.userService.findUserByInternalId(iid);
      this.logger.debug(`User found: ${user?.id}`);
      if (!user) {
        this.logger.error('User not found in handleConfirmRegistration');
        throw new Error('User not found');
      }
      const latest_program = user.programs[user.programs.length - 1]?.name;
      if (!latest_program) {
        await this.client.replyMessage({
          replyToken,
          messages: [RegistConfirmFlex, CommonUserFlex],
        });
      } else {
        await this.client.replyMessage({
          replyToken,
          messages: [RegistConfirmFlex, ProgramUserFlex(latest_program)],
        });
      }
      console.log('Registration confirmation message sent successfully');
    } catch (error) {
      console.error('Error handling confirm registration:', error);
    }
  }

  async handleConfirmCodeChange(replyToken: string, uid: string) {
    try {
      const iid = await getInternalId(undefined, uid);
      const user = await this.userService.findUserByInternalId(iid);
      this.logger.debug(`User found: ${user?.id}`);
      const latest_program = user?.programs[user.programs.length - 1]?.name;
      if (!latest_program) {
        this.logger.error('No latest program found for user:', user?.id);
        throw new Error('No latest program found');
      }
      await this.client.replyMessage({
        replyToken,
        messages: [ProgramUserFlex(latest_program)],
      });
      console.log('Code change confirmation message sent successfully');
    } catch (error) {
      console.error('Error handling confirm code change:', error);
    }
  }

  async handleMealRecord(replyToken: string, uid: string): Promise<string> {
    this.logger.debug('Handling meal record for user:', uid);
    this.logger.debug('Reply token:', replyToken);
    try {
      const response = await this.client.replyMessage({
        replyToken,
        messages: [AskForImageFlex],
      });
      this.logger.debug('AskForImageFlex sent successfully:', response);
    } catch (error) {
      this.logger.error(
        `Error sending AskForImageFlex with reply ${replyToken}:`,
        error,
      );
      throw new Error('Failed to send AskForImageFlex');
    }
    const iid = await getInternalId(undefined, uid).catch((error) => {
      this.logger.error('Error getting internal ID:', error);
      throw new Error('Failed to get internal ID');
    });
    this.logger.debug('Internal ID:', iid);

    const user = await this.userService.findUserByInternalId(iid);
    if (!user) {
      this.logger.error('User not found in handleMealRecord');
      throw new Error('User not found');
    } else {
      const createJob = await this.userStateQueue.add('create-user-state', {
        user: user,
        state: 'waiting for meal image',
      });

      await this.queueEventsRegistryService.waitForJobResult(
        createJob,
        this.userStateQueue,
      );
      return 'Waiting for meal image state is created';
    }
  }

  async handleWaitingState(
    event: line.WebhookEvent,
    user_state: UserState,
  ): Promise<string> {
    let result = 'Handling waiting state No Result';
    this.logger.debug('Handling waiting state:', user_state.state);
    if (!event.source.userId) {
      this.logger.error('User ID not found in event source');
      throw new Error('User ID not found');
    }
    if (event.type === 'message') {
      switch (user_state.state) {
        case 'waiting for meal image':
          result = await this.recordCaseHandler.waitingMealImage(
            event,
            user_state,
          );
          break;
        case 'waiting for what meal':
          result = await this.recordCaseHandler.waitingWhatMeal(
            event,
            user_state,
          );
          break;
        case 'is prediction correct':
          result = await this.recordCaseHandler.MenuChoicesConfirm(
            event,
            user_state,
          );
          break;
      }
    }
    return result;
  }

  async handleNonRegisteredUser(replyToken: string, userId?: string) {
    this.logger.debug('Handling non-registered user:', userId);
    try {
      await this.client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: `คุณยังไม่ได้ลงทะเบียนในระบบ กรุณาเลือกประเภทผู้ใช้งาน และยอมรับเงื่อนไขการใช้งาน`,
          },
          ClassifyFlex(),
        ],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      this.logger.error('Error handling non-registered user:', error);
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

  async handleMealRecordPoster(
    replyToken: string,
    uid: string,
  ): Promise<string> {
    this.logger.debug(`user ${uid} requested to get meal record poster`);
    try {
      const iid = await getInternalId(undefined, uid);
      const user = await this.userService.findUserByInternalId(iid);
      if (!user) {
        this.logger.error('User not found in handleMealRecordPoster');
        throw new Error('User not found');
      }
      const posterState = user.states.find(
        (state) => state.state === 'date-poster',
      );
      if (!posterState) {
        this.logger.warn('No date poster state found for user:', user.id);
        throw new Error('No date poster state found');
      }
      try {
        await this.client.replyMessage({
          replyToken,
          messages: [posterState.messageToSend],
        });
      } catch (error) {
        this.logger.error(
          `Error sending meal record poster with reply ${replyToken}:`,
          error,
        );
        throw new Error('Failed to send meal record poster');
      }
      this.logger.debug('Meal record poster sent successfully');
      const removeJob = await this.userStateQueue.add(
        'remove-user-state',
        posterState.id,
      );
      await this.queueEventsRegistryService.waitForJobResult(
        removeJob,
        this.userStateQueue,
      );
      this.logger.debug('Removed user state after sending poster');

      return 'Meal record poster sent successfully';
    } catch (error) {
      this.logger.error('Error handling meal record poster:', error);
      throw error;
    }
  }
}
