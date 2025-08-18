import {
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateProgramDto } from './dto/create.dto';
import { ShortTokenGuard } from 'src/auth/short-token.guard';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { UpdateProgramDto } from './dto/update.dto';
import { Program } from './entities/programs.entity';

@Controller('program')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);
  constructor(
    @InjectQueue('program') private readonly programQueue: Queue,
    private readonly queueEventsRegistryService: QueueEventsRegistryService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createProgram(
    @Request() req: { user: { internalId: string; id: number } },
    @Body()
    body: CreateProgramDto,
  ) {
    this.logger.debug(`Creating program with data: ${JSON.stringify(body)}`);
    const job = await this.programQueue.add('create-program', {
      userId: req.user.id,
      body: body,
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Get('/:id/info')
  @UseGuards(JwtAuthGuard)
  async getProgramInfo(
    @Request() req: { user: { internalId: string; id: number } },
    @Param('id') id: number,
  ) {
    this.logger.debug(`Fetching program info for ID: ${req.user.id}`);
    const job = await this.programQueue.add('get-program-info', {
      id: id,
      userId: req.user.id,
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Post('validate-code')
  @UseGuards(ShortTokenGuard)
  async validateProgram(@Body('code') code: string) {
    const job = await this.programQueue.add('validate-code', {
      code: code,
    });
    try {
      const result = await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
      if (result === true) {
        this.logger.debug(`Program code ${code} is valid.`);
        return { valid: true };
      } else {
        this.logger.warn(`Program code ${code} is invalid.`);
        throw new NotFoundException(`Program code ${code} does not exist`);
      }
    } catch (error) {
      this.logger.error(`Error validating program code ${code}: ${error}`);
      throw error;
    }
  }

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateProgram(
    @Request() req: { user: { internalId: string; id: number } },
    @Body() body: UpdateProgramDto,
  ) {
    this.logger.debug(
      `Updating program from admin ID: ${req.user.id} and data: ${JSON.stringify(body)}`,
    );
    try {
      if (!body.id) {
        this.logger.error('Program ID is required for update.');
        throw new NotFoundException('Program ID is required for update');
      }

      const adminProgramJob = await this.programQueue.add(
        'check-admin-program-exists',
        {
          adminId: req.user.id,
          programId: body.id,
        },
      );
      const adminProgramResult =
        (await this.queueEventsRegistryService.waitForJobResult(
          adminProgramJob,
          this.programQueue,
        )) as { isExists: boolean };

      if (!adminProgramResult.isExists) {
        this.logger.error(
          `Admin with ID ${req.user.id} does not own program with ID ${body.id}`,
        );
        throw new UnauthorizedException(
          `Admin with ID ${req.user.id} does not own program with ID ${body.id}`,
        );
      }

      const job = await this.programQueue.add('update-program', {
        body: body,
      });
      const result = (await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      )) as { error?: boolean; statusCode?: number; message?: string };

      if (result && result.error) {
        if (result.statusCode === 404) {
          throw new NotFoundException(result.message);
        }
        // Add more status codes as needed
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating program from admin ID ${req.user.id}: ${error}`,
      );
      throw error;
    }
  }

  // @Post('check-admin-program-exists')
  // async checkAdminProgramExists(
  //   @Body() body: { adminId: number; programId: number },
  // ) {
  //   this.logger.debug(
  //     `Checking if admin with ID ${body.adminId} owns program with ID ${body.programId}`,
  //   );
  //   const job = await this.programQueue.add('check-admin-program-exists', {
  //     adminId: body.adminId,
  //     programId: body.programId,
  //   });
  //   const result: unknown =
  //     await this.queueEventsRegistryService.waitForJobResult(
  //       job,
  //       this.programQueue,
  //     );
  //   return result;
  // }

  @Get('table')
  @UseGuards(JwtAuthGuard)
  async getProgramTable(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    this.logger.debug(`Fetching program table for admin ID: ${req.user.id}`);
    const job = await this.programQueue.add('get-program-table', {
      adminId: req.user.id,
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Get('/:id/users')
  @UseGuards(JwtAuthGuard)
  async getProgramUsers(
    @Request() req: { user: { internalId: string; id: number } },
    @Param('id') programId: number,
  ) {
    this.logger.debug(`Fetching users for program ID: ${programId}`);
    const job = await this.programQueue.add('get-program-users', {
      programId: programId,
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Put('org')
  @UseGuards(JwtAuthGuard)
  async updateProgramOrg(
    @Request() req: { user: { internalId: string; id: number } },

    @Body() body: { organizationId: number; programId: number },
  ) {
    this.logger.debug(
      `Updating organization for program ID: ${body.programId} by admin ID: ${req.user.id}`,
    );

    const checkJob = await this.programQueue.add('check-admin-program-exists', {
      adminId: req.user.id,
      programId: body.programId,
    });
    const checkResult = (await this.queueEventsRegistryService.waitForJobResult(
      checkJob,
      this.programQueue,
    )) as { isExists: boolean };
    if (!checkResult.isExists) {
      this.logger.error(
        `Admin with ID ${req.user.id} does not own program with ID ${body.programId}`,
      );
      throw new UnauthorizedException(
        `Admin with ID ${req.user.id} does not own program with ID ${body.programId}`,
      );
    }
    this.logger.debug(
      `Admin with ID ${req.user.id} owns program with ID ${body.programId}, proceeding with update.`,
    );
    const job = await this.programQueue.add('update-program-org', {
      body: {
        id: body.programId,
        organizationId: body.organizationId,
      },
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Put('name')
  @UseGuards(JwtAuthGuard)
  async updateProgramName(
    @Request() req: { user: { internalId: string; id: number } },
    @Body() body: { name: string; programId: number },
  ) {
    this.logger.debug(
      `Updating name for program ID: ${body.programId} by admin ID: ${req.user.id}`,
    );

    const checkJob = await this.programQueue.add('check-admin-program-exists', {
      adminId: req.user.id,
      programId: body.programId,
    });
    const checkResult = (await this.queueEventsRegistryService.waitForJobResult(
      checkJob,
      this.programQueue,
    )) as { isExists: boolean };
    if (!checkResult.isExists) {
      this.logger.error(
        `Admin with ID ${req.user.id} does not own program with ID ${body.programId}`,
      );
      throw new UnauthorizedException(
        `Admin with ID ${req.user.id} does not own program with ID ${body.programId}`,
      );
    }
    this.logger.debug(
      `Admin with ID ${req.user.id} owns program with ID ${body.programId}, proceeding with update.`,
    );
    const job = await this.programQueue.add('update-program-name', {
      body: {
        id: body.programId,
        name: body.name,
      },
    });
    const result: unknown =
      await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      );
    return result;
  }

  @Get('find-by-code/:code')
  @UseGuards(JwtAuthGuard)
  async findProgramByCode(
    @Request() req: { user: { internalId: string; id: number } },
    @Param('code') code: string,
  ) {
    this.logger.debug(`Finding program by code: ${code}`);
    const job = await this.programQueue.add('find-program-by-code', {
      code: code,
    });
    const result: Program =
      (await this.queueEventsRegistryService.waitForJobResult(
        job,
        this.programQueue,
      )) as Program;
    if (!result) {
      this.logger.warn(`Program with code ${code} not found.`);
      throw new NotFoundException(`Program with code ${code} not found`);
    }

    const checkJob = await this.programQueue.add('check-admin-program-exists', {
      adminId: req.user.id,
      programId: result.id,
    });
    const checkResult = (await this.queueEventsRegistryService.waitForJobResult(
      checkJob,
      this.programQueue,
    )) as { isExists: boolean };
    if (!checkResult.isExists) {
      this.logger.error(
        `Admin with ID ${req.user.id} does not own program with ID ${result.id}`,
      );
      throw new UnauthorizedException(
        `Admin with ID ${req.user.id} does not own program with ID ${result.id}`,
      );
    }
    this.logger.debug(
      `Admin with ID ${req.user.id} owns program with code ${code}, returning program info.`,
    );
    return result;
  }
}
