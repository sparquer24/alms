import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
      // Handle specific HTTP exceptions thrown by the service
      if (error instanceof ConflictException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'Conflict - Duplicate data',
          },
          HttpStatus.CONFLICT
        );
      }
      
      if (error instanceof BadRequestException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'Bad Request - Invalid data',
          },
          HttpStatus.BAD_REQUEST
        );
      }
      
      if (error instanceof InternalServerErrorException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'Internal Server Error',
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      // Handle any other unexpected errors
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Application creation failed',
          error: error.message || 'Unknown error',
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
      if (['ADMIN', 'POLICE_OFFICER', 'DM_OFFICE'].includes(userRole)) { // need to move to constants
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

  // Helper endpoints for getting valid IDs
  @Get('helpers/states')
  async getStates() {
    try {
      const states = await this.applicationFormService.getStates();
      return {
        success: true,
        message: 'States retrieved successfully',
        data: states,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch states',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('helpers/districts/:stateId')
  async getDistrictsByState(@Param('stateId') stateId: string) {
    try {
      const districts = await this.applicationFormService.getDistrictsByState(Number(stateId));
      return {
        success: true,
        message: 'Districts retrieved successfully',
        data: districts,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch districts',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('helpers/police-stations/:divisionId')
  async getPoliceStationsByDivision(@Param('divisionId') divisionId: string) {
    try {
      const policeStations = await this.applicationFormService.getPoliceStationsByDivision(Number(divisionId));
      return {
        success: true,
        message: 'Police stations retrieved successfully',
        data: policeStations,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch police stations',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('helpers/validate-ids')
  async validateIds(@Request() req: any) {
    try {
      const { stateId, districtId, jurisdictionStationId } = req.query;
      
      const validation = await this.applicationFormService.validateReferenceIds({
        stateId: stateId ? Number(stateId) : undefined,
        districtId: districtId ? Number(districtId) : undefined,
        jurisdictionStationId: jurisdictionStationId ? Number(jurisdictionStationId) : undefined,
      });
      
      return {
        success: true,
        message: 'ID validation completed',
        data: validation,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to validate IDs',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('helpers/check-aadhar/:aadharNumber')
  async checkAadharExists(@Param('aadharNumber') aadharNumber: string) {
    try {
      const result = await this.applicationFormService.checkAadharExists(aadharNumber);
      
      return {
        success: true,
        message: result.exists 
          ? 'Aadhar number already exists in system' 
          : 'Aadhar number is available',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to check Aadhar number',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}