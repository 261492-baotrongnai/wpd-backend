import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import { Admin } from 'src/admin/entities/admin.entity';
import { Program } from 'src/programs/entities/programs.entity';
import { Like } from 'typeorm';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  generateBrief(eng_name: string): string {
    const words = eng_name
      .replace(/[^A-Za-z ]/g, '') // Remove non-letters
      .trim()
      .split(/\s+/);

    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    } else if (words.length === 2) {
      return (words[0][0] + words[1][0] + words[1][1]).toUpperCase();
    } else {
      return words[0].slice(0, 3).toUpperCase();
    }
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    if (!createOrganizationDto.code_name) {
      const brief = this.generateBrief(createOrganizationDto.eng_name);

      // Find existing codes starting with brief

      const existing = await this.organizationRepository.find({
        where: {
          code_name: Like(`${brief}-%`),
        },
      });

      const lastCodeName = existing[existing.length - 1]?.code_name;
      const latest_suffix = lastCodeName?.split('-')[1];
      const suffixNumber = Number(latest_suffix) || 0;
      const code_name = `${brief}-${String(suffixNumber + 1).padStart(2, '0')}`;
      createOrganizationDto.code_name = code_name;
    }
    const organization = this.organizationRepository.create({
      ...createOrganizationDto,
    });

    return await this.organizationRepository.save(organization);
  }
  async findAll() {
    return await this.organizationRepository.find();
  }

  async findOne(id: number) {
    return await this.organizationRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    return await this.organizationRepository.delete(id);
  }

  async findProgramsOfOrganization(organizationId: number): Promise<Program[]> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['programs'],
    });
    return organization ? organization.programs : [];
  }

  async addAdminToOrganization(
    organizationId: number,
    adminId: number,
  ): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['admins'],
    });
    if (!organization) {
      throw new Error('Organization not found');
    }
    organization.admins.push({ id: adminId } as Admin);
    return await this.organizationRepository.save(organization);
  }

  async getOrganizationTable(adminId: number) {
    return await this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.admins', 'admin')
      .leftJoinAndSelect('organization.programs', 'program')
      .where('admin.id = :adminId', { adminId })
      .getMany();
  }
}
