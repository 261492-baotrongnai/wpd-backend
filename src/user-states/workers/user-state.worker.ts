import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { UserStatesService } from '../user-states.service';
import { Job } from 'bullmq';
import { CreateUserStateDto } from '../dto/create-user-state.dto';
import { UpdateUserStateDto } from '../dto/update-user-state.dto';

@Processor('user-state', {
  concurrency: 150,
})
export class UserStateProcessor extends WorkerHost {
  private logger = new Logger(UserStateProcessor.name);

  constructor(private readonly userStatesService: UserStatesService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'get-all-iids-user-states') {
      this.logger.debug(
        `Processing get-all-iids-user-states job id: ${job.id}`,
      );
      return await this.userStatesService.getAllUserInternalIds();
    } else if (job.name === 'create-user-state') {
      this.logger.debug(
        `Processing create-user-state job id: ${job.id} with data: ${JSON.stringify(job.data)}`,
      );
      return await this.userStatesService.create(
        job.data as CreateUserStateDto,
      );
    } else if (job.name === 'update-user-state') {
      this.logger.debug(
        `Processing update-user-state job id: ${job.id} with data: ${JSON.stringify(job.data)}`,
      );
      const { id, updateUserStateDto } = job.data as {
        id: number;
        updateUserStateDto: UpdateUserStateDto;
      };
      return await this.userStatesService.update(id, updateUserStateDto);
    } else if (job.name === 'find-user-state-by-id') {
      this.logger.debug(
        `Processing find-user-state-by-id job id: ${job.id} with data: ${job.data}`,
      );
      return await this.userStatesService.findOne(job.data as number);
    } else if (job.name === 'find-all-by-user') {
      this.logger.debug(
        `Processing find-all-by-user job id: ${job.id} with data: ${job.data}`,
      );
      return await this.userStatesService.findAllByUser(job.data as number);
    } else if (job.name === 'remove-user-state') {
      this.logger.debug(
        `Processing remove-user-state job id: ${job.id} with data: ${job.data}`,
      );
      return await this.userStatesService.remove(job.data as number);
    } else if (job.name === 'get-candidates') {
      this.logger.debug(
        `Processing get-candidates job id: ${job.id} with data: ${job.data}`,
      );
      return await this.userStatesService.findCandidates(job.data as number);
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    const progressStr =
      typeof job.progress === 'object'
        ? JSON.stringify(job.progress)
        : String(job.progress);
    this.logger.log(`Job ${job.id} progress: ${progressStr}%`);
  }

  @OnWorkerEvent('active')
  onAdded(job: Job) {
    this.logger.log(`Got job ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
    this.logger.error(`Attempts: ${job.attemptsMade}`);
  }
}
