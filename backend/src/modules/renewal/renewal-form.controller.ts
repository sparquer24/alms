import { Controller, Get, Post, Body, Param,Query,Delete,Patch,UseGuards,Request, HttpCode,HttpStatus,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery, ApiParam,} from '@nestjs/swagger';
import { RenewalFormService } from './renewal-form.service';
import { CreateRenewalPersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchRenewalApplicationDetailsDto } from './dto/patch-application-details.dto';
import { UploadRenewalFileDto, UploadRenewalFileResponseDto } from './dto/upload-file.dto';
import { GetRenewalApplicationsDto } from './dto/get-applications.dto';
import { UpdateRenewalWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { RenewalFormResponse } from '../../request/renewal-form';

@ApiTags('Renewal Forms')
@Controller('renewal-forms')
@ApiBearerAuth('JWT-auth')
export class RenewalFormController {
  constructor(private readonly renewalFormService: RenewalFormService) {}

  /**
   * Create a new renewal form with personal details
   * Step 1: Initial application creation with DRAFT status
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new renewal form',
    description: 'Create a new renewal form with personal details (Step 1). Returns applicationId with DRAFT status',
  })
  @ApiBody({
    type: CreateRenewalPersonalDetailsDto,
    description: 'Personal details for creating renewal form',
  })
  @ApiResponse({
    status: 201,
    description: 'Renewal form created successfully',
    schema: { $ref: '#/components/schemas/RenewalFormResponse' },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or license already has renewal' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createRenewalForm(
    @Body() createRequest: CreateRenewalPersonalDetailsDto,
    @Request() req: any,
  ): Promise<RenewalFormResponse> {
    const userId = req.user?.id || req.body.currentUserId;
    return this.renewalFormService.createPersonalDetails(createRequest, userId);
  }

  /**
   * Update application details (addresses, occupation, license details, biometrics)
   * Can be used for multiple steps to gradually fill the form
   */
  @Patch('/:applicationId')
  @ApiOperation({
    summary: 'Update renewal application details',
    description: 'Update addresses, occupation, license details, biometrics and other sections',
  })
  @ApiParam({
    name: 'applicationId',
    type: Number,
    description: 'Application ID to update',
  })
  @ApiBody({
    type: PatchRenewalApplicationDetailsDto,
    description: 'Application details to update',
  })
  @ApiQuery({
    name: 'isSubmit',
    required: false,
    type: Boolean,
    description: 'Whether to submit the application after update',
  })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
    schema: { $ref: '#/components/schemas/RenewalFormResponse' },
  })
  @ApiResponse({ status: 400, description: 'Invalid data or application is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateApplicationDetails(
    @Param('applicationId') applicationId: string,
    @Body() patchData: PatchRenewalApplicationDetailsDto,
    @Query('isSubmit') isSubmit?: string,
    @Request() req?: any,
  ): Promise<RenewalFormResponse> {
    const userId = req?.user?.id || 1;
    const applId = parseInt(applicationId, 10);
    const submitApp = isSubmit === 'true';

    return this.renewalFormService.patchApplicationDetails(
      applId,
      { ...patchData, isSubmit: submitApp },
      userId,
    );
  }

  /**
   * Upload files to renewal application
   */
  @Post('/:applicationId/upload-file')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload file to renewal application',
    description: 'Store file metadata/URL for the application',
  })
  @ApiParam({
    name: 'applicationId',
    type: Number,
    description: 'Application ID',
  })
  @ApiBody({
    type: UploadRenewalFileDto,
    description: 'File details to upload',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadRenewalFileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadFile(
    @Param('applicationId') applicationId: string,
    @Body() uploadData: UploadRenewalFileDto,
  ): Promise<UploadRenewalFileResponseDto> {
    const applId = parseInt(applicationId, 10);
    return this.renewalFormService.uploadFile(applId, uploadData);
  }

  /**
   * Delete a file from renewal application
   */
  @Delete('/file/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a file from renewal application',
    description: 'Remove a specific file record from the application',
  })
  @ApiParam({
    name: 'fileId',
    type: Number,
    description: 'File ID to delete',
  })
  @ApiResponse({
    status: 204,
    description: 'File deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteFile(@Param('fileId') fileId: string): Promise<void> {
    const fId = parseInt(fileId, 10);
    return this.renewalFormService.deleteFile(fId);
  }

  /**
   * Delete entire renewal application
   * Only allowed for DRAFT status applications
   */
  @Delete('/application/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete entire renewal application',
    description: 'Delete the complete draft application with all child records. Only works for DRAFT status',
  })
  @ApiParam({
    name: 'applicationId',
    type: Number,
    description: 'Application ID to delete',
  })
  @ApiResponse({
    status: 204,
    description: 'Application deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Application is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteApplication(@Param('applicationId') applicationId: string): Promise<void> {
    const applId = parseInt(applicationId, 10);
    return this.renewalFormService.deleteApplicationById(applId);
  }

  /**
   * Get renewal applications with pagination, filtering, and search
   */
  @Get()
  @ApiOperation({
    summary: 'Get renewal applications',
    description: 'Retrieve applications with pagination, filtering, and search capabilities',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, license number, or acknowledgement number',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by workflow status',
  })
  @ApiQuery({
    name: 'currentUserId',
    required: false,
    type: Number,
    description: 'Filter by current user ID',
  })
  @ApiQuery({
    name: 'ordering',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Order by field (default: createdAt)',
  })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RenewalFormResponse' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getApplications(@Query() filters: GetRenewalApplicationsDto): Promise<{
    data: RenewalFormResponse[];
    total: number;
  }> {
    return this.renewalFormService.getFilteredApplications(filters);
  }

  @Get('/:applicationId')
  @ApiOperation({
    summary: 'Get renewal application by ID',
    description: 'Retrieve a specific renewal application with all related details',
  })
  @ApiParam({
    name: 'applicationId',
    type: Number,
    description: 'Application ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Application retrieved successfully',
    schema: { $ref: '#/components/schemas/RenewalFormResponse' },
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getApplicationById(
    @Param('applicationId') applicationId: string,
  ): Promise<RenewalFormResponse> {
    const applId = parseInt(applicationId, 10);
    return this.renewalFormService.getApplicationById(applId);
  }
}
