import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PendingUpload } from './entities/pending-uploads.entity';
import { Repository } from 'typeorm';
import { CreatePendingDto } from './dto/create-pending.dto';
import { UserState } from 'src/user-states/entities/user-state.entity';

@Injectable()
export class PendingUploadsService {
  logger = new Logger(PendingUploadsService.name);
  constructor(
    @InjectRepository(PendingUpload)
    private readonly pendingUploadsRepository: Repository<PendingUpload>,
  ) {}

  async create(pendingUpload: CreatePendingDto) {
    this.logger.debug('Creating pending upload:', pendingUpload);

    // Find the UserState first
    const userState = await this.pendingUploadsRepository.manager.findOne(
      UserState,
      {
        where: { id: pendingUpload.userState.id },
        relations: ['pendingUpload'], // Include this relation to check if it already has a pending upload
      },
    );

    if (!userState) {
      throw new Error(
        `UserState with id ${pendingUpload.userState.id} does not exist`,
      );
    }

    // If the userState already has a pendingUpload, handle it appropriately
    // (either update the existing one or delete it first)
    if (userState.pendingUpload) {
      this.logger.debug(
        `UserState ${userState.id} already has a pendingUpload - removing it first`,
      );
      await this.pendingUploadsRepository.delete(userState.pendingUpload.id);
      // Clear the reference
      userState.pendingUpload = null;
      await this.pendingUploadsRepository.manager.save(UserState, userState);
    }

    // Create a new PendingUpload entity
    const newPendingUpload = this.pendingUploadsRepository.create({
      fileName: pendingUpload.fileName,
      filePath: pendingUpload.filePath,
      status: pendingUpload.status,
      userState: userState, // Set the userState reference
    });

    // Save the new pending upload
    const savedUpload =
      await this.pendingUploadsRepository.save(newPendingUpload);

    // Now update the userState to reference this new pending upload
    userState.pendingUpload = savedUpload;
    await this.pendingUploadsRepository.manager.save(UserState, userState);

    return savedUpload;
  }
}
