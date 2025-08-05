import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksController.name);
  constructor(
    readonly webhookService: WebhooksService,
    @InjectQueue('webhook') private readonly webhooksQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  @Post('')
  async getWebhook(
    @Req()
    req: {
      headers: { [key: string]: string };
      body: Buffer;
    },
    @Res() res: Response,
  ) {
    // Need to receive raw body as Buffer because some messsage from flex actions can't be validate the parsed body
    // Verify the signature
    const isValid = line.validateSignature(
      req.body.toString(),
      process.env.LINE_CHANNEL_SECRET || '',
      req.headers['x-line-signature'],
    );

    if (!isValid) {
      this.logger.warn('Invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Parse the request body after verifying the signature
    // The body is a Buffer, so we need to convert it to a string
    // and then parse it as JSON
    const body = JSON.parse(req.body.toString()) as {
      events: line.WebhookEvent[];
    };
    const events: line.WebhookEvent[] = body.events;

    if (!events || events.length === 0) {
      return res.status(200).json({ message: 'No events to process' });
    }

    // Send 200 OK immediately to acknowledge receipt
    res.status(200).json({ message: 'Webhook received' });

    // // Process the events asynchronously after sending the response
    const events_job = await this.webhooksQueue.add('process-event', events);

    try {
      const result: unknown = await this.waitForJobResult(
        events_job,
        this.webhooksQueue,
      );
      this.logger.debug(
        `Job ${events_job.id} completed with result: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error waiting for job result: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }

    // Process the events asynchronously after sending the response
    // return await this.webhookService.processEvents(events).catch((error) => {
    //   this.logger.error('Error processing events:', error);
    // });
  }

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = this.queueEventsRegistryService.getQueueEvents(queue);
    const result: string = (await job.waitUntilFinished(queueEvents)) as string;
    await queueEvents.close();
    return result;
  }
}
