import { Injectable, Logger } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create.dto';

@Injectable()
export class ProgramsJobService {
  private readonly logger = new Logger(ProgramsJobService.name);
  constructor(private readonly programsService: ProgramsService) {}
  async handleCreateProgramJob(id: number, body: CreateProgramDto) {
    this.logger.debug(`Creating program with data: ${JSON.stringify(body)}`);
    return await this.programsService.createProgram(id, body);
  }

  async handleGetProgramInfoJob(id: number) {
    this.logger.debug(`Fetching program info for ID: ${id}`);
    return await this.programsService.getProgramInfoFromUser(id);
  }

  async handleFindProgramByCodeJob(code: string) {
    this.logger.debug(`Finding program by code: ${code}`);
    const program = await this.programsService.findProgramByCode(code);
    return program;
  }
}
