import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEventsRegistryService } from 'src/queue-events/queue-events.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    @InjectQueue('organization') private readonly organizationQueue: Queue,
    private readonly queueEventRegistryService: QueueEventsRegistryService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: { user: { internalId: string; id: number } },
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    const job = await this.organizationQueue.add('create-organization', {
      createOrganizationDto,
      adminId: req.user.id,
    });
    const result = await this.queueEventRegistryService.waitForJobResult(
      job,
      this.organizationQueue,
    );
    return result;
  }

  @Get('table')
  @UseGuards(JwtAuthGuard)
  async getOrganizationTable(
    @Request() req: { user: { internalId: string; id: number } },
  ) {
    const job = await this.organizationQueue.add('get-organization-table', {
      adminId: req.user.id,
    });
    const result = await this.queueEventRegistryService.waitForJobResult(
      job,
      this.organizationQueue,
    );
    return result;
  }

  // @Get('find-all')
  // findAll() {
  //   return this.organizationsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.organizationsService.findOne(+id);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.organizationsService.remove(+id);
  // }
}
