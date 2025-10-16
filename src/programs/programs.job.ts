import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create.dto';

@Injectable()
export class ProgramsJobService {
  private readonly logger = new Logger(ProgramsJobService.name);
  constructor(private readonly programsService: ProgramsService) {}
  async handleCreateProgramJob(id: number, body: CreateProgramDto) {
    this.logger.debug(
      `Creating program with data: ${JSON.stringify(body)} by Admin ID: ${id}`,
    );
    return await this.programsService.createProgram(id, body);
  }

  async handleGetProgramInfoJob(id: number, userId: number) {
    this.logger.debug(`Fetching program info for ID: ${id}`);
    const isOwned = await this.programsService.isAdminOwnProgram(userId, id);
    if (!isOwned) {
      this.logger.warn(
        `User ${userId} is not authorized to access program ${id}`,
      );
      throw new UnauthorizedException(
        `User ${userId} is not authorized to access program ${id}`,
      );
    }
    return await this.programsService.getProgramInfo(id);
  }

  async handleFindProgramByCodeJob(code: string) {
    this.logger.debug(`Finding program by code: ${code}`);
    if (!code || code.trim() === '') {
      this.logger.warn('Program code is empty');
      return null;
    }
    const program = await this.programsService.findProgramByCode(code);
    return program;
  }

  async handleValidateCodeJob(code: string): Promise<boolean> {
    this.logger.debug(`Validating program with code: ${code}`);
    return await this.programsService.isProgramCodeExist(code);
  }
}
