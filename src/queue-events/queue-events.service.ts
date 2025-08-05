import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue, QueueEvents } from 'bullmq';

@Injectable()
export class QueueEventsRegistryService {
  private readonly logger = new Logger(QueueEventsRegistryService.name);
  private queueEventsMap: Map<string, QueueEvents> = new Map();

  getQueueEvents(queue: Queue): QueueEvents {
    if (!this.queueEventsMap.has(queue.name)) {
      const queueEvents = new QueueEvents(queue.name, {
        connection: queue.opts.connection,
      });
      this.queueEventsMap.set(queue.name, queueEvents);
    }
    return this.queueEventsMap.get(queue.name)!;
  }

  async waitForJobResult(job: Job, queue: Queue) {
    const queueEvents = this.getQueueEvents(queue);
    const result: unknown = await job.waitUntilFinished(queueEvents);
    return result;
  }
}
