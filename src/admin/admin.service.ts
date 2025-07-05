import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Admin } from './entities/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectQueue('admin') private adminQueue: Queue,
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}
  async createLine(iid: string) {
    const existingAdmin = await this.adminRepository.findOne({
      where: { internalId: iid },
    });
    if (existingAdmin) {
      this.logger.warn(`Admin with internalId ${iid} already exists.`);
      return existingAdmin;
    }
    const newAdmin = new Admin();
    newAdmin.internalId = iid;
    const savedAdmin = await this.adminRepository.save(newAdmin);
    this.logger.log(`Admin with internalId ${iid} created successfully.`);
    return savedAdmin;
  }

  // createEmail(createAdminEmailDto: CreateAdminEmailDto) {
  //   return 'This action adds a new admin';
  // }

  async findAdminByInternalId(internalId: string) {
    const admin = await this.adminRepository
      .createQueryBuilder('admin')
      .where('admin.internalId = :internalId', { internalId })
      .getOne();

    return admin;
  }
}
