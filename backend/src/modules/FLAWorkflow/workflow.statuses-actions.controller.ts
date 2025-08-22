import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('statuses-actions')
  @ApiOperation({ summary: 'Get statuses and actions', description: 'Fetch all statuses and actions, or by id if provided.' })
  @ApiResponse({ status: 200, description: 'List of statuses and actions, or single status/action by id.' })
  @ApiQuery({ name: 'id', required: false, type: Number, description: 'Optional id to filter status and action' })
  async getStatusesAndActions(@Query('id') id?: string) {
    const result = await this.workflowService.getStatusesAndActions(id ? Number(id) : undefined);
    if (id && !result.status && !result.action) {
      throw new NotFoundException('No status or action found for the given id');
    }
    return result;
  }
}
