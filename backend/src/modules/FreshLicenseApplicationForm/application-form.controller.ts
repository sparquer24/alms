import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationFormService, CreateFreshLicenseApplicationsFormsInput } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';
import { RequirePermissions } from '../../decorators/permissions.decorator';
import prisma from '../../db/prismaClient';

@ApiTags('Application Form')
@Controller('api/application-form')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create Fresh License Application', 
    description: 'Create a new arms license application form' 
  })
  @ApiBody({
    description: 'Application form data',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Application created successfully',
    example: {
      success: true,
      message: 'Arms License Application created successfully',
      data: {
        id: 'app_123',
        applicationNumber: 'ALMS2025001',
        status: 'SUBMITTED',
        createdAt: '2025-08-20T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid application data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions to create fresh license applications' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate data (e.g., Aadhar already exists)' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  // @RequirePermissions('CREATE_APPLICATION')
  async createApplication(@Body() createApplicationDto: CreateFreshLicenseApplicationsFormsInput, @Request() req: any) {
    try {
      // Check if user has permission to create fresh license applications
      const user = await prisma.users.findUnique({
        where: { id: req.user.sub },
        include: { role: true }
      });

      if (!user?.role?.can_create_freshLicence) {
        throw new HttpException(
          {
            success: false,
            message: 'You do not have permission to create fresh license applications',
            error: 'Insufficient permissions'
          },
          HttpStatus.FORBIDDEN
        );
      }
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
      
      // Handle Prisma null constraint violation (e.g., id field)
      if (error.message && error.message.includes('Null constraint violation') && error.message.includes('id')) {
        throw new HttpException(
          {
            success: false,
            message: 'A required field was missing or invalid when saving the address. Please ensure all address fields are filled correctly.',
            error: 'Address creation failed due to missing or invalid data (id field)'
          },
          HttpStatus.BAD_REQUEST
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
  @ApiOperation({ 
    summary: 'Get All Applications', 
    description: 'Retrieve all applications accessible to the current user' 
  })
  @ApiQuery({ 
    name: 'statusId', 
    required: false, 
    description: 'Filter applications by status ID',
    example: '1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications retrieved successfully',
    example: {
      success: true,
      message: 'Applications retrieved successfully',
      data: [
        {
          id: 'app_123',
          applicationNumber: 'ALMS2025001',
          status: 'SUBMITTED',
          applicantName: 'John Doe',
          createdAt: '2025-08-20T12:00:00.000Z',
          relations: ['personalInfo', 'address', 'documents']
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  // @RequirePermissions('VIEW_APPLICATIONS')
  async getAllApplications(@Request() req: any) {
    try {
      // If user is not admin/officer, only show their own applications
      const userRole = req.user.roleCode;
      const userId = req.user.sub;
      
      // Get statusId from query params if provided
      const statusId = req.query?.statusId ? Number(req.query.statusId) : undefined;

      let applications;
      // if (['ADMIN', 'POLICE_OFFICER', 'DM_OFFICE'].includes(userRole)) { // need to move to constants
      //   applications = await this.applicationFormService.getFilteredApplications({ statusId });
      // } 

      applications = await this.applicationFormService.getFilteredApplications({ statusId, currentUserId: userId });

      // For each application, collect the relation table names (keys with object/array values)
      const applicationsWithRelations = applications.map((app: any) => {
        const relationNames: string[] = [];
        for (const key in app) {
          if (!Object.prototype.hasOwnProperty.call(app, key)) continue;
          // Exclude primitive fields and id fields
          const value = app[key];
          if (
            value &&
            (typeof value === 'object') &&
            !(value instanceof Date) &&
            !Array.isArray(value) &&
            Object.keys(value).length > 0
          ) {
            relationNames.push(key);
          }
          if (Array.isArray(value) && value.length > 0) {
            relationNames.push(key);
          }
        }
        return {
          ...app,
          relations: relationNames,
        };
      });

      return {
        success: true,
        message: 'Applications retrieved successfully',
        data: applicationsWithRelations,
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
  @ApiOperation({ 
    summary: 'Get Application by ID', 
    description: 'Retrieve a specific application by its ID' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Application ID',
    example: 'app_123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application retrieved successfully',
    example: {
      success: true,
      message: 'Application retrieved successfully',
      data: {
        id: 'app_123',
        applicationNumber: 'ALMS2025001',
        status: 'SUBMITTED',
        personalInfo: {
          name: 'John Doe',
          fatherName: 'Robert Doe',
          dateOfBirth: '1990-01-01'
        },
        address: {
          houseNumber: '123',
          street: 'Main Street',
          city: 'Kolkata'
        },
        createdAt: '2025-08-20T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Access denied to this application' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ 
    summary: 'Get States for Application Form', 
    description: 'Get all available states for use in application forms' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'States retrieved successfully',
    example: {
      success: true,
      message: 'States retrieved successfully',
      data: [
        { id: 1, name: 'West Bengal', code: 'WB' },
        { id: 2, name: 'Maharashtra', code: 'MH' }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ 
    summary: 'Get Districts by State', 
    description: 'Get all districts for a specific state' 
  })
  @ApiParam({ 
    name: 'stateId', 
    description: 'State ID',
    example: '1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Districts retrieved successfully',
    example: {
      success: true,
      message: 'Districts retrieved successfully',
      data: [
        { id: 1, name: 'Kolkata', stateId: 1 },
        { id: 2, name: 'Howrah', stateId: 1 }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ 
    summary: 'Get Police Stations by Division', 
    description: 'Get all police stations for a specific division' 
  })
  @ApiParam({ 
    name: 'divisionId', 
    description: 'Division ID',
    example: '1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Police stations retrieved successfully',
    example: {
      success: true,
      message: 'Police stations retrieved successfully',
      data: [
        { id: 1, name: 'Lalbazar Police Station', divisionId: 1 },
        { id: 2, name: 'Bowbazar Police Station', divisionId: 1 }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Division not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ 
    summary: 'Validate Reference IDs', 
    description: 'Validate if the provided state and district IDs are valid and exist' 
  })
  @ApiQuery({ 
    name: 'stateId', 
    required: false, 
    description: 'State ID to validate',
    example: '1'
  })
  @ApiQuery({ 
    name: 'districtId', 
    required: false, 
    description: 'District ID to validate',
    example: '1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'ID validation completed',
    example: {
      success: true,
      message: 'ID validation completed',
      data: {
        valid: true,
        state: { id: 1, name: 'West Bengal', valid: true },
        district: { id: 1, name: 'Kolkata', valid: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async validateIds(@Request() req: any) {
    try {
      const { stateId, districtId } = req.query;
      
      const validation = await this.applicationFormService.validateReferenceIds({
        stateId: stateId ? Number(stateId) : undefined,
        districtId: districtId ? Number(districtId) : undefined,
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
  @ApiOperation({ 
    summary: 'Check Aadhar Number Availability', 
    description: 'Check if an Aadhar number already exists in the system' 
  })
  @ApiParam({ 
    name: 'aadharNumber', 
    description: 'Aadhar number to check (12 digits)',
    example: '123456789012'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Aadhar check completed',
    example: {
      success: true,
      message: 'Aadhar number is available',
      data: {
        exists: false,
        aadharNumber: '123456789012',
        available: true
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Aadhar already exists',
    example: {
      success: true,
      message: 'Aadhar number already exists in system',
      data: {
        exists: true,
        aadharNumber: '123456789012',
        available: false
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 400, description: 'Invalid Aadhar number format' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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