import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as line from '@line/bot-sdk';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly client: line.messagingApi.MessagingApiClient;

  constructor() {
    const config = {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
    };
    this.client = new line.messagingApi.MessagingApiClient(config);
  }

  @Cron('0 7 * * *')
  async handleMorningCron() {
    const message =
      'มื้อเช้านี้จะกินอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    await this.client
      .broadcast({ messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('LINE message scheduled sent: ' + message))
      .catch((err) => this.logger.error('Failed to send LINE message', err));
  }

  @Cron('0 11 * * *')
  async handleLaunchCron() {
    const message =
      'มื้อเที่ยงนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    await this.client
      .broadcast({ messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('LINE message scheduled sent: ' + message))
      .catch((err) => this.logger.error('Failed to send LINE message', err));
  }

  @Cron('0 16 * * *')
  async handleEveningCron() {
    const message =
      'มื้อเย็นนี้จะกินเมนูอะไรดีคะ? กินแล้วอย่าลืมถ่ายรูปส่งมาให้มะลิิดูด้วยน้าาา 😉';

    await this.client
      .broadcast({ messages: [{ type: 'text', text: message }] })
      .then(() => this.logger.log('LINE message scheduled sent: ' + message))
      .catch((err) => this.logger.error('Failed to send LINE message', err));
  }
}
