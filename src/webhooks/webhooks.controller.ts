import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as line from '@line/bot-sdk';
import { Response } from 'express';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';

@Controller('webhooks')
export class WebhooksController {
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly logger = new Logger(WebhooksController.name);
  constructor(
    readonly webhookService: WebhooksService,
    @InjectQueue('webhook') private readonly webhooksQueue: Queue,
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
    // const events_job = await this.webhooksQueue.add('process-event', events);

    // const result: unknown = await this.waitForJobResult(
    //   events_job,
    //   this.webhooksQueue,
    // );
    // this.logger.debug(
    //   `Job ${events_job.id} completed with result: ${JSON.stringify(result)}`,
    // );
    // return result;

    await this.webhookService
      .processEvents(events)
      .then((result) => {
        this.logger.debug(`Events processed successfully: ${result}`);
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          this.logger.error(`Error processing events: ${error.message}`);
        } else {
          this.logger.error(
            `Error processing events: ${JSON.stringify(error)}`,
          );
        }
      });
  }

  private async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = new QueueEvents(queue.name, {
      connection: queue.opts.connection,
    });
    const result: unknown = await job.waitUntilFinished(queueEvents);
    await queueEvents.close();
    return result;
  }
}
