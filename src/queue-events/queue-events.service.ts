import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';

@Injectable()
export class QueueEventsRegistryService {
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
}
