import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Program } from './entities/programs.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { UpdateProgramDto } from './dto/update.dto';
import { Organization } from 'src/organizations/entities/organization.entity';
import { CreateProgramDto } from './dto/create.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { Meal } from 'src/meals/entities/meal.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly entityManager: EntityManager,

    @InjectQueue('meal')
    private readonly mealQueue: Queue,

    private readonly userService: UsersService,

    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  async createProgram(id: number, program: CreateProgramDto): Promise<Program> {
    const admin = await this.entityManager.findOne(Admin, {
      where: { id },
    });
    if (!admin) {
      this.logger.warn(`Admin with ID ${id} not found.`);
      throw new NotFoundException(`Admin with ID ${id} not found.`);
    }
    const newProgram = new Program(program);
    newProgram.admins = [admin];
    this.logger.debug(`Creating program: ${JSON.stringify(newProgram)}`);
    if (program.organizationId) {
      const organization = await this.entityManager.findOne(Organization, {
        where: { id: program.organizationId },
      });
      if (!organization) {
        this.logger.warn(
          `Organization with ID ${program.organizationId} not found.`,
        );
        throw new NotFoundException(
          `Organization with ID ${program.organizationId} not found.`,
        );
      }
      newProgram.organization = organization;

      const existingCodes = (
        await this.programRepository.find({
          where: { organization: { id: program.organizationId } },
        })
      )
        .map((prog) => Number(prog.code?.split('-')[1] ?? 0))
        .sort((a, b) => a - b);
      this.logger.debug(
        `Existing program codes for organization ${organization.code_name}: ${JSON.stringify(
          existingCodes,
        )}`,
      );
      if (existingCodes.length === 0) {
        // If no existing codes, start with 01
        newProgram.code = `${organization.code_name}-001`;
        this.logger.debug(
          `No existing codes found for organization ${organization.code_name}. Starting with code ${newProgram.code}`,
        );
      } else {
        // Find the next available code
        const nextCodeNumber = existingCodes[existingCodes.length - 1] + 1;
        newProgram.code = `${organization.code_name}-${String(
          nextCodeNumber,
        ).padStart(3, '0')}`;
        this.logger.debug(
          `Next available code for organization ${organization.code_name} is ${newProgram.code}`,
        );
      }
    }
    const savedProgram = await this.programRepository.save(newProgram);
    this.logger.debug(
      `Program created with ID: ${savedProgram.id}, Name: ${savedProgram.name} by Admin ID: ${savedProgram.admins[0].id}`,
    );
    return savedProgram;
  }

  async getProgramInfo(program_id: number) {
    this.logger.debug(`Fetching programs for program ID: ${program_id}`);

    const program = await this.programRepository.findOne({
      where: { id: program_id },
      relations: ['users', 'admins', 'organization'],
    });
    if (!program) {
      this.logger.warn(`Program with ID ${program_id} not found.`);
      return new NotFoundException(`Program with ID ${program_id} not found.`);
    }
    const totalParticipants = program.users.length;

    this.logger.debug(`Program found: ${JSON.stringify(program)}`);
    return { program, totalParticipants };
  }

  async findProgramByCode(code: string): Promise<Program | null> {
    const program = await this.programRepository.findOne({
      where: { code },
      relations: ['admins', 'users', 'organization'],
    });
    if (!program) {
      this.logger.warn(`Program with code ${code} not found.`);
      return null;
    }
    this.logger.debug(`Program found: ${JSON.stringify(program)}`);
    return program;
  }

  async isProgramCodeExist(code: string): Promise<boolean> {
    const program = await this.programRepository.findOne({
      where: { code },
    });
    const exists = !!program;
    this.logger.debug(`Program code ${code} existence check: ${exists}`);

    return exists;
  }

  async updateProgram(updateData: UpdateProgramDto) {
    this.logger.debug(`Updating program with ID: ${updateData.id}`);

    // Extract organizationId if present
    const { organizationId, ...rest } = updateData;

    // Update basic fields
    const result = await this.programRepository.update(updateData.id, rest);
    if (result.affected === 0) {
      this.logger.warn(`No program found with ID: ${updateData.id} to update.`);
      throw new NotFoundException(`No program found with ID: ${updateData.id}`);
    }

    // If organizationId is provided, update the relation
    if (organizationId) {
      const program = await this.programRepository.findOne({
        where: { id: updateData.id },
      });
      if (!program) {
        throw new NotFoundException(
          `No program found with ID: ${updateData.id}`,
        );
      }
      const organization = await this.entityManager.findOne('Organization', {
        where: { id: organizationId },
        relations: ['programs'],
      });
      if (!organization) {
        return {
          error: true,
          statusCode: 404,
          message: `Organization with ID: ${organizationId} not found`,
        };
      }
      // Assign the full Organization entity to the program
      program.organization = organization as Organization;
      await this.programRepository.save(program);
    }

    this.logger.debug(
      `Program with ID: ${updateData.id} updated successfully.`,
    );
    return {
      message: `Program updated successfully `,
      result: await this.programRepository.findOne({
        where: { id: updateData.id },
        relations: ['organization'],
      }),
    };
  }

  async isAdminOwnProgram(
    adminId: number,
    programId: number,
  ): Promise<{ isExists: boolean }> {
    this.logger.debug(
      `Checking if admin with ID ${adminId} owns program with ID ${programId}`,
    );
    const program = await this.programRepository.findOne({
      where: { admins: { id: adminId }, id: programId },
    });
    const exists = !!program;
    this.logger.debug(
      `Admin with ID ${adminId} owns program with ID ${programId}: ${exists}`,
    );
    return { isExists: exists };
  }

  async getProgramTable(
    adminId: number,
  ): Promise<{ program: Program; totalUser: number }[]> {
    this.logger.debug(`Fetching program table for admin ID: ${adminId}`);
    const programs = await this.programRepository.find({
      where: { admins: { id: adminId } },
      relations: ['users', 'organization'],
    });
    const programTable = programs.map((program) => ({
      program,
      totalUser: program.users.length,
    }));
    this.logger.debug(
      `Program table for admin ID ${adminId}: ${JSON.stringify(programTable)}`,
    );
    return programTable;
  }

  async getProgramUsers(programCode: string) {
    this.logger.debug(`Fetching users for program code: ${programCode}`);
    const program = await this.programRepository.findOne({
      where: { code: programCode },
      relations: ['users'],
    });
    if (!program) {
      this.logger.warn(`Program with code ${programCode} not found.`);
      return { users: [] };
    }
    const users_with_last_recorded_at = await Promise.all(
      program.users.map(async (user) => {
        const latest_meal = await this.entityManager.findOne(Meal, {
          where: { user: { id: user.id } },
          order: { createdAt: 'DESC' },
        });
        return {
          ...user,
          last_recorded_at: latest_meal ? latest_meal.createdAt : null,
        };
      }),
    );

    const sorted_users = users_with_last_recorded_at.sort((a, b) => {
      if (a.last_recorded_at && b.last_recorded_at) {
        return b.last_recorded_at.getTime() - a.last_recorded_at.getTime();
      } else if (a.last_recorded_at) {
        return -1; // a comes first
      } else if (b.last_recorded_at) {
        return 1; // b comes first
      } else {
        return 0; // maintain original order
      }
    });

    const users_with_profile = await Promise.all(
      sorted_users.map(async (user) => {
        if (!user.userId) {
          return { ...user, profile: null };
        }
        const profile = await this.userService.getLineProfile(user.userId);
        return {
          ...user,
          profile,
        };
      }),
    );

    this.logger.debug(
      `Program users for program code ${programCode}: ${JSON.stringify(
        users_with_last_recorded_at,
      )}`,
    );
    this.logger.log(`Fetched users for program :`);
    this.logger.log(users_with_last_recorded_at);

    return { users: users_with_profile };
  }

  async isPermitToViewUser(userId: number, adminId: number): Promise<boolean> {
    const rawRows = await this.entityManager
      .createQueryBuilder(Program, 'program')
      .leftJoin('program.admins', 'admin')
      .leftJoin('program.users', 'user')
      .where('admin.id = :adminId', { adminId })
      .select('user.id', 'userId')
      .getRawMany<{ userId: string | number | null }>();

    const userIds_in_admin_programs: number[] = rawRows
      .map((row) => (row.userId == null ? NaN : Number(row.userId)))
      .filter((id) => !Number.isNaN(id));

    this.logger.debug(
      `User IDs in programs managed by admin ${adminId}: ${JSON.stringify(
        userIds_in_admin_programs,
      )}`,
    );

    const is_permit = userIds_in_admin_programs.includes(Number(userId));
    this.logger.debug(
      `Admin with ID ${adminId} has permission to view user with ID ${userId}: ${is_permit}`,
    );
    return is_permit;
  }
}
