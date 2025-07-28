import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApplicationFormService, CreateFreshLicenseApplicationsFormsInput } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@Controller('api/application-form')
@UseGuards(AuthGuard)
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) {}

  @Post()
  // @RequirePermissions('CREATE_APPLICATION')
  async createApplication(@Body() createApplicationDto: CreateFreshLicenseApplicationsFormsInput, @Request() req: any) {
    try {
      // Add user context to the application using currentUserId as per schema
      const applicationData = {
        ...createApplicationDto,
        currentUserId: req.user.sub
      };
      const application = await this.applicationFormService.createApplication(applicationData);
      return {
        success: true,
        message: 'Arms License Application created successfully',
        data: application,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Application creation failed',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  // @RequirePermissions('VIEW_APPLICATIONS')
  async getAllApplications(@Request() req: any) {
    try {
      // If user is not admin/officer, only show their own applications
      const userRole = req.user.roleCode;
      const userId = req.user.sub;
      
      // Get statusId from query params if provided
      const statusId = req.query?.statusId ? Number(req.query.statusId) : undefined;

      let applications;
      if (['ADMIN', 'POLICE_OFFICER', 'DM_OFFICE'].includes(userRole)) {
        applications = await this.applicationFormService.getFilteredApplications({ statusId });
      } else {
        applications = await this.applicationFormService.getFilteredApplications({ statusId, currentUserId: userId });
      }

      return {
        success: true,
        message: 'Applications retrieved successfully',
        data: applications,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch applications',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  // @RequirePermissions('VIEW_APPLICATION_DETAILS')
  async getApplicationById(@Param('id') id: string, @Request() req: any) {
    try {
      const application = await this.applicationFormService.getApplicationById(id);
      if (!application) {
        throw new HttpException(
          {
            success: false,
            message: 'Application not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if user can access this application
      const userRole = req.user.roleCode;
      const userId = req.user.sub;
      
      // If user is not admin/officer, they can only view their own applications
      if (!['ADMIN'].includes(userRole)) {
        // Defensive: check for currentUserId on the application object
        if (!('currentUserId' in application) || application.currentUserId !== userId) {
          throw new HttpException(
            {
              success: false,
              message: 'Access denied to this application',
            },
            HttpStatus.FORBIDDEN
          );
        }
      }
      
      return {
        success: true,
        message: 'Application retrieved successfully',
        data: application,
      };
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND || error.status === HttpStatus.FORBIDDEN) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch application',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}