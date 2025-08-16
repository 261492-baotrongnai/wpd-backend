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

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly entityManager: EntityManager,

    @InjectQueue('meal')
    private readonly mealQueue: Queue,

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
      `Program created with ID: ${savedProgram.id}, Name: ${savedProgram.name}`,
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
      relations: ['admins', 'users'],
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

  async getProgramUsers(programId: number) {
    this.logger.debug(`Fetching users for program ID: ${programId}`);
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['users'],
    });
    if (!program) {
      this.logger.warn(`Program with ID ${programId} not found.`);
      return { users: [] };
    }
    const users_with_last_recorded_at = await Promise.all(
      program.users.map(async (user) => {
        const latest_meal_job = await this.mealQueue.add('find-latest-meal', {
          userId: user.id,
        });
        const latestMeal =
          (await this.queueEventsRegistryService.waitForJobResult(
            latest_meal_job,
            this.mealQueue,
          )) as Meal | null;
        return {
          ...user,
          last_recorded_at: latestMeal?.createdAt || null,
        };
      }),
    );
    this.logger.debug(
      `Program users for program ID ${programId}: ${JSON.stringify(
        users_with_last_recorded_at,
      )}`,
    );

    return { users: users_with_last_recorded_at };
  }
}
