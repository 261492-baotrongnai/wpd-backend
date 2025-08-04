import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserStatesService } from '../user-states.service';
import { Job } from 'bullmq';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState } from '../entities/user-state.entity';

@Injectable()
@Processor('user-state', { concurrency: 150 })
export class UserStateProcessor extends WorkerHost {
  private logger = new Logger(UserStateProcessor.name);

  constructor(
    private readonly userStatesService: UserStatesService,
    @InjectRepository(UserState)
    private readonly userStatesRepository: Repository<UserState>,
  ) {
    super();
  }

  async process(job: Job) {
    this.logger.debug(`Processing ${job.name} job id: ${job.id}`);
    switch (job.name) {
      case 'get-all-iids-user-states':
        return await this.userStatesService.getAllUserInternalIds();
      case 'create-user-state':
        return await this.userStatesService.create(job.data);
      case 'update-user-state':
        return await this.userStatesService.update(
          job.data.id,
          job.data.updateUserStateDto,
        );
      case 'find-user-state-by-id':
        return await this.userStatesService.findOne(job.data);
      case 'find-all-by-user':
        const userId = job.data;
        const userStates = await this.userStatesRepository.find({
          where: { user: { id: userId } },
          relations: ['user'],
        });
        return userStates.map((us) => ({
          ...us,
          user: {
            id: us.user.id,
            internalId: us.user.internalId,
            isActive: us.user.isActive,
            createdAt: us.user.createdAt,
            updatedAt: us.user.updatedAt,
          },
        }));
      // return await this.userStatesService.findAllByUser(job.data);
      case 'remove-user-state':
        return await this.userStatesService.remove(job.data);
      case 'get-candidates':
        return await this.userStatesService.findCandidates(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return null;
    }
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.log(
      `Job ${job.name} ${job.id} progress: ${JSON.stringify(job.progress)}%`,
    );
  }

  @OnWorkerEvent('active')
  onAdded(job: Job) {
    this.logger.log(`Got job ${job.name} ${job.id} of type ${job.name}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.name} ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.name} ${job.id} failed: ${error.message}`);
    this.logger.error(`Attempts: ${job.attemptsMade}`);
  }
}
