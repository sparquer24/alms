import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CancelFormService } from './cancel-form.service';
import { CreateCancelRequestDto, CreateCancelRequestResponseDto } from './dto/create-cancel-request.dto';
import { UpdateCancelRequestDto } from './dto/update-cancel-request.dto';
import { CancelRequestActionDto, CancelRequestActionResponseDto } from './dto/cancel-request-action.dto';
import { AuthGuard } from '../../middleware/auth.middleware';

@ApiTags('Cancel Form')
@Controller('cancel-forms')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class CancelFormController {
  constructor(private readonly cancelFormService: CancelFormService) {}

  /**
   * Submit a new cancel request
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a cancel request',
    description: 'Submit a new cancellation request for an application. Validates that the application exists and is in a cancellable state.',
  })
  @ApiBody({
    type: CreateCancelRequestDto,
    description: 'Cancel request data',
    examples: {
      'Cancel Fresh License Application': {
        summary: 'Cancel a fresh license application',
        value: {
          applicationId: 1,
          applicationType: 'CancelApplication',
          cancellationReason: 'Applicant no longer requires the arms license',
          remarks: 'Applicant has submitted a voluntary surrender letter',
        },
      },
      'Cancel Renewal Application': {
        summary: 'Cancel a renewal application',
        value: {
          applicationId: 2,
          applicationType: 'CancelApplication',
          cancellationReason: 'Duplicate application submitted in error',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cancel request submitted successfully',
    type: CreateCancelRequestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or application not in cancellable state' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Not found - Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createCancelRequest(
    @Body() dto: CreateCancelRequestDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub || req.user?.userId || req.user?.id;
      if (!userId) {
        throw new ForbiddenException('User not authenticated.');
      }

      const result = await this.cancelFormService.createCancelRequest(dto, userId);
      return {
        success: true,
        message: 'Cancel request submitted successfully',
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get all cancel requests with pagination and filtering
   */
  @Get()
  @ApiOperation({
    summary: 'Get all cancel requests',
    description: 'Retrieve cancel requests with pagination, filtering by status, requester, or application ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status (PENDING, APPROVED, REJECTED)' })
  @ApiQuery({ name: 'requestedBy', required: false, type: Number, description: 'Filter by requester user ID' })
  @ApiQuery({ name: 'applicationId', required: false, type: Number, description: 'Filter by application ID' })
  @ApiResponse({
    status: 200,
    description: 'Cancel requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cancel requests retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              applicationId: { type: 'number' },
              applicationType: { type: 'string' },
              cancellationReason: { type: 'string' },
              status: { type: 'string' },
              requestedDate: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCancelRequests(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('requestedBy') requestedBy?: number,
    @Query('applicationId') applicationId?: number,
  ) {
    try {
      const result = await this.cancelFormService.getCancelRequests({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status,
        requestedBy: requestedBy ? Number(requestedBy) : undefined,
        applicationId: applicationId ? Number(applicationId) : undefined,
      });

      return {
        success: true,
        message: 'Cancel requests retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a cancel request by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get cancel request by ID',
    description: 'Retrieve a specific cancel request with full details including requester and actioner information',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Cancel request ID' })
  @ApiResponse({
    status: 200,
    description: 'Cancel request retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            applicationId: { type: 'number' },
            applicationType: { type: 'string' },
            cancellationReason: { type: 'string' },
            remarks: { type: 'string' },
            status: { type: 'string' },
            requestedDate: { type: 'string', format: 'date-time' },
            actionedDate: { type: 'string', format: 'date-time' },
            requester: { type: 'object' },
            actioner: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cancel request not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCancelRequestById(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.cancelFormService.getCancelRequestById(id);
      return {
        success: true,
        message: 'Cancel request retrieved successfully',
        data: result,
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update a cancel request (change reason/remarks)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update cancel request',
    description: 'Update the cancellation reason or remarks for a pending cancel request. Only the requester can update their own request.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Cancel request ID' })
  @ApiBody({
    type: UpdateCancelRequestDto,
    description: 'Fields to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancel request updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot update processed request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the requester' })
  @ApiResponse({ status: 404, description: 'Cancel request not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateCancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCancelRequestDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub || req.user?.userId || req.user?.id;
      if (!userId) {
        throw new ForbiddenException('User not authenticated.');
      }

      const result = await this.cancelFormService.updateCancelRequest(id, dto, userId);
      return {
        success: true,
        message: 'Cancel request updated successfully',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Process a cancel request action (APPROVED/REJECTED)
   * When approved, updates the original application status to CANCELLED
   */
  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process cancel request action',
    description: 'Approve or reject a pending cancel request. When approved, the original application will be marked as CANCELLED and a workflow history entry will be created.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Cancel request ID' })
  @ApiBody({
    type: CancelRequestActionDto,
    description: 'Action to perform',
    examples: {
      'Approve Cancel Request': {
        summary: 'Approve and cancel the application',
        value: {
          action: 'APPROVED',
          remarks: 'Cancellation approved. Application will be marked as cancelled.',
        },
      },
      'Reject Cancel Request': {
        summary: 'Reject the cancel request',
        value: {
          action: 'REJECTED',
          remarks: 'Cancellation request rejected. Application must continue processing.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cancel request processed successfully',
    type: CancelRequestActionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid action or request already processed' })
  @ApiResponse({ status: 404, description: 'Cancel request not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processCancelRequestAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelRequestActionDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.sub || req.user?.userId || req.user?.id;
      if (!userId) {
        throw new ForbiddenException('User not authenticated.');
      }

      const result = await this.cancelFormService.processCancelRequestAction(id, dto, userId);
      return result;
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }
}
