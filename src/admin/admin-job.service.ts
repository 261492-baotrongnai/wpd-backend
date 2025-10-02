import { Injectable, Logger } from '@nestjs/common';
import { AdminService } from './admin.service';
import { getInternalId } from 'src/users/user-utility';

@Injectable()
export class AdminJobService {
  private readonly logger = new Logger(AdminJobService.name);

  constructor(private readonly adminService: AdminService) {}

  async handleCreateAdminLineJob(createAdminLineDto: {
    idToken: string;
    username?: string;
  }) {
    const iid = await getInternalId(createAdminLineDto.idToken);

    return await this.adminService.createLine(iid, createAdminLineDto.username);
  }

  async handleGetAdminInfoJob(jobData: { internalId: string; id: number }) {
    const admin = await this.adminService.adminInfo(jobData.id);
    if (!admin) {
      this.logger.warn(
        `Admin with internalId ${jobData.internalId} id ${jobData.id} not found.`,
      );
      return null;
    }
    return admin;
  }
}
