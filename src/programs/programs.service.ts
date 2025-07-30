import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Program } from './entities/programs.entity';
import { Admin } from 'src/admin/entities/admin.entity';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly entityManager: EntityManager,
  ) {}

  async createProgram(id: number, program: Partial<Program>) {
    const admin = await this.entityManager.findOne(Admin, {
      where: { id },
    });
    if (!admin) {
      this.logger.warn(`Admin with ID ${id} not found.`);
      throw new Error(`Admin with ID ${id} not found.`);
    }
    const newProgram = new Program(program);
    newProgram.admins = [admin];
    const savedProgram = await this.programRepository.save(newProgram);
    this.logger.debug(
      `Program created with ID: ${savedProgram.id}, Name: ${savedProgram.name}`,
    );
    return savedProgram;
  }

  async getProgramInfoFromUser(admin_id: number): Promise<Program[] | null> {
    this.logger.debug(`Fetching programs for admin ID: ${admin_id}`);

    const programs = await this.programRepository.find({
      where: { admins: { id: admin_id } },
      relations: ['admins', 'users'],
    });
    if (programs.length === 0) {
      this.logger.warn(`No programs found for admin ID: ${admin_id}`);
      return null;
    }
    this.logger.debug(
      `Found ${programs.length} programs for admin ID: ${admin_id}`,
    );
    return programs;
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
}
