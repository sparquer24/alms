import { Controller, Get, HttpException, HttpStatus, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { ApplicationFormService } from './application-form.service';

@ApiTags('Hierarchy')
@Controller('users-in-hierarchy')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationHierarchyController {
  constructor(private readonly applicationFormService: ApplicationFormService) {}

  @Get(':applicationId')
  @ApiOperation({
    summary: 'Get users in hierarchy for an application',
    description:
      'Resolve the forward hierarchy for Fresh, Renewal, or CancelForm applications using the same endpoint. Pass applicationType to switch between application tables.',
  })
  @ApiParam({
    name: 'applicationId',
    description: 'Application ID',
    example: '38',
  })
  @ApiQuery({
    name: 'applicationType',
    required: false,
    type: String,
    description:
      'Application type used to resolve the correct application table. Examples: FreshApplication, FreshLicenseApplicationForm, RenewalApplicationForm, CancelApplication.',
    examples: {
      fresh: { value: 'FreshApplication' },
      renewal: { value: 'RenewalApplicationForm' },
      cancel: { value: 'CancelApplication' },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Users in hierarchy fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Application not found or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUsersInHierarchy(
    @Param('applicationId') applicationId: string,
    @Query('applicationType') applicationType?: string,
    @Request() req?: any,
  ) {
    try {
      const applicationIdNum = parseInt(applicationId, 10);
      if (Number.isNaN(applicationIdNum)) {
        throw new HttpException(
          { success: false, message: 'Invalid application ID format' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const [error, users] = await this.applicationFormService.getUsersInHierarchy(applicationIdNum, applicationType);

      if (error) {
        const errorMessage = typeof error === 'object' && error.message ? error.message : error;
        throw new HttpException(
          {
            success: false,
            message: errorMessage,
            error: errorMessage,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        success: true,
        message: 'Users in hierarchy fetched successfully',
        data: users,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch users in hierarchy',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}