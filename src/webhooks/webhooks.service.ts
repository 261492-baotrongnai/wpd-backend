import { Injectable, Logger } from '@nestjs/common';
import { AskForImageFlex, ClassifyFlex, GreetingFlex } from './flex-message';
import * as line from '@line/bot-sdk';
import { UsersService } from 'src/users/users.service';
import { getInternalId } from 'src/users/user-utility';
import axios from 'axios';
import { UserState } from 'src/user-states/entities/user-state.entity';
import { RecordCaseHandler } from './record-case';
import { RegistConfirmFlex } from 'src/users/user-flex';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';

// const secretKey = process.env.INTERNAL_ID_SECRET;

@Injectable()
export class WebhooksService {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksService.name);

  // Initialize LINE SDK client and import user service
  constructor(
    private readonly userService: UsersService,
    private readonly recordCaseHandler: RecordCaseHandler,
    @InjectQueue('user-state') private readonly userStateQueue: Queue,
  ) {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }

  async processEvents(events: line.WebhookEvent[]): Promise<string> {
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
          this.logger.debug('User states: ', user_states);
          // if there no waiting state, process the message normally
          if (user_states === null) {
            if (event.message?.type === 'text') {
              if (uid && (await this.isUserExist(uid)) === true) {
                switch (event.message.text) {
                  case 'ยันยันการบันทึกผู้ใช้':
                    this.logger.debug('User requested to confirm registration');
                    await this.handleConfirmRegistration(event.replyToken);
                    break;
                  case 'ยันยันการแก้ไขโค้ด':
                    this.logger.debug('User requested to confirm code change');
                    await this.handleConfirmCodeChange(event.replyToken, uid);
                    break;
                  case 'บันทึกอาหารที่ทาน':
                    this.logger.debug('User requested to record meal:');
                    await this.handleMealRecord(event.replyToken, uid);
                }
              } else {
                this.logger.warn(
                  'Received message from non-registered user, message:',
                  event.message.text,
                );
                await this.handleNonRegisteredUser(event.replyToken, uid);
              }
            }
          } else {
            this.logger.log('handle waiting state');
            for (const user_state of user_states) {
              await this.handleWaitingState(event, user_state);
            }
          }
        } else if (event.type === 'follow') {
          await this.handleFollowEvent(event.replyToken);
        } else {
          this.logger.warn(`Unsupported event type: ${event.type}`);
        }
      } catch {
        this.logger.error(`Error processing event: ${JSON.stringify(event)}`);
      }
    }
    return 'Events processed successfully';
  }

  async checkUserState(uid: string) {
    const iid = await getInternalId(undefined, uid);

    const user = await this.userService.findUserByInternalId(iid);
    this.logger.debug(`CheckUserState - User found: ${user?.id}`);
    if (!user || user.states.length === 0) {
      this.logger.error('User not found or no states in checkUserState');
      return null;
    } else {
      const userStatesJob = await this.userStateQueue.add(
        'find-all-by-user',
        user.id,
      );
      const user_states: UserState[] = (await this.waitForJobResult(
        userStatesJob,
        this.userStateQueue,
      )) as UserState[];
      this.logger.debug(
        `User states found: ${user_states.map((us) => us.state).join(', ')}`,
      );
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
        messages: [GreetingFlex, ClassifyFlex()],
      });
      console.log('Welcome message sent successfully');
    } catch (error) {
      console.error('Error handling follow event:', error);
      throw error;
    }
  }

  async handleConfirmRegistration(replyToken: string) {
    try {
      await this.client.replyMessage({
        replyToken,
        messages: [RegistConfirmFlex],
      });
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
      const latest_program = user?.programs[user.programs.length - 1].name;
      await this.client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: `คุณได้เข้าร่วมโครงการ "${latest_program}"`,
          },
        ],
      });
      console.log('Code change confirmation message sent successfully');
    } catch (error) {
      console.error('Error handling confirm code change:', error);
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
      const createJob = await this.userStateQueue.add('create-user-state', {
        user: user,
        state: 'waiting for meal image',
      });

      await this.waitForJobResult(createJob, this.userStateQueue);
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
          await this.recordCaseHandler.waitingMealImage(event, user_state);
          break;
        case 'waiting for what meal':
          await this.recordCaseHandler.waitingWhatMeal(event, user_state);
          break;
        case 'is prediction correct':
          await this.recordCaseHandler.MenuChoicesConfirm(event, user_state);
          break;
      }
    }
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
}
