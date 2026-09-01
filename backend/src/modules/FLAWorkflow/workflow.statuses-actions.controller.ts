import { Controller, Get, Query, NotFoundException, BadRequestException } from '@nestjs/common';
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

  @Get('applications')
  @ApiOperation({ summary: 'Get applications by type', description: 'Fetch applications based on application type (FreshLicenseApplicationForm or RenewalApplicationForm).' })
  @ApiResponse({ status: 200, description: 'List of applications filtered by type.' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid or missing applicationType' })
  @ApiResponse({ status: 404, description: 'Not found - No applications found for the given type' })
  @ApiQuery({ name: 'applicationType', required: true, type: String, description: 'Type of application: flawUpdate, FreshLicenseApplicationForm, renewUpdate, or RenewalApplicationForm', example: 'FreshLicenseApplicationForm' })
  async getApplicationsByType(@Query('applicationType') applicationType?: string) {
    if (!applicationType) {
      throw new BadRequestException('applicationType query parameter is required');
    }
    try {
      const result = await this.workflowService.getApplicationsByType(applicationType);
      if (!result || result.length === 0) {
        throw new NotFoundException(`No applications found for type: ${applicationType}`);
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : `Invalid applicationType: ${applicationType}`;
      throw new BadRequestException(errorMessage);
    }
  }
}
