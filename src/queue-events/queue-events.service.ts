import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, QueueEvents } from 'bullmq';

@Injectable()
export class QueueEventsRegistryService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueEventsRegistryService.name);
  private queueEventsMap: Map<string, QueueEvents> = new Map();

  getQueueEvents(queue: Queue): QueueEvents {
    if (!this.queueEventsMap.has(queue.name)) {
      const queueEvents = new QueueEvents(queue.name, {
        connection: queue.opts.connection,
      });

      // Add error handling for queue events
      queueEvents.on('error', (error) => {
        this.logger.error(`QueueEvents error for ${queue.name}:`, error);
      });

      this.queueEventsMap.set(queue.name, queueEvents);
    }
    return this.queueEventsMap.get(queue.name)!;
  }

  async waitForJobResult(
    job: Job,
    queue: Queue,
    timeoutMs: number = 300000,
  ): Promise<unknown> {
    // 5 minutes default timeout
    const queueEvents = this.getQueueEvents(queue);

    try {
      // Add timeout wrapper
      const result: unknown = await Promise.race([
        job.waitUntilFinished(queueEvents),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`Job ${job.id} timed out after ${timeoutMs}ms`)),
            timeoutMs,
          ),
        ),
      ]);

      this.logger.debug(`Job ${job.id} (${job.name}) completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Job ${job.id} (${job.name}) failed or timed out:`,
        error,
      );

      // Try to get job state for debugging
      try {
        const jobState = await job.getState();
        this.logger.error(`Job ${job.id} current state: ${jobState}`);

        if (jobState === 'active' || jobState === 'waiting') {
          this.logger.warn(`Attempting to fail stuck job ${job.id}`);
          await job.remove();
        }
      } catch (stateError) {
        this.logger.error(`Could not get job state for ${job.id}:`, stateError);
      }

      throw error;
    }
  }

  async onModuleDestroy() {
    // Clean up queue events connections
    for (const [queueName, queueEvents] of this.queueEventsMap.entries()) {
      try {
        await queueEvents.close();
        this.logger.debug(`Closed QueueEvents for ${queueName}`);
      } catch (error) {
        this.logger.error(`Error closing QueueEvents for ${queueName}:`, error);
      }
    }
    this.queueEventsMap.clear();
  }
}
