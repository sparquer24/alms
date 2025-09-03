import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationFormService } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';

@ApiTags('Application Form')
@Controller('application-form')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) {}

  @Post()
  @ApiOperation({ summary: 'Create Application', description: 'Create a new application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createApplication(@Body() applicationData: any, @Request() req: any) {
    try {
      const [error, result] = await this.applicationFormService.createApplication(applicationData);
      if (error) {
        // Provide more details if error is an object
        const errorMessage = typeof error === 'object' && error.message ? error.message : error;
        const errorDetails = typeof error === 'object' ? error : {};
        throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.BAD_REQUEST);
      }
      return { success: true, data: result };
    } catch (err: any) {
      // Provide more details if err is an object
      const errorMessage = err?.message || err;
      const errorDetails = err;
      throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get Applications', description: 'Retrieve applications with filtering, pagination, and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchField', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  async getApplications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchField') searchField?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('order') order?: string
  ) {
    try {
      // Parse pagination
      const pageNum = page ? Math.max(Number(page), 1) : 1;
      const limitNum = limit ? Math.max(Number(limit), 1) : 10;

      // Parse ordering
      const allowedOrderFields = ['id', 'firstName', 'lastName', 'acknowledgementNo', 'createdAt'];
      const parsedOrderBy = orderBy && allowedOrderFields.includes(orderBy) ? orderBy : 'createdAt';
      const parsedOrder = order && order.toLowerCase() === 'asc' ? 'asc' : 'desc';

      // Parse search + field
      const allowedSearchFields = ['id', 'firstName', 'lastName', 'acknowledgementNo'];
      const parsedSearchField = searchField && allowedSearchFields.includes(searchField) ? searchField : undefined;
      const parsedSearchValue = search ?? undefined;

      // Call service method (you may need to adjust this to match your service signature)
      const result = await this.applicationFormService.getFilteredApplications({
        page: pageNum,
        limit: limitNum,
        searchField: parsedSearchField,
        search: parsedSearchValue,
        orderBy: parsedOrderBy,
        order: parsedOrder as 'asc' | 'desc',
        currentUserId: req.user?.sub // If you need user context
      });

      return {
        success: true,
        message: 'Applications retrieved successfully',
        data: result.data,
        pagination: {
          total: result.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(result.total / (limitNum || 10)),
        }
      };
    } catch (error: any) {
      throw new HttpException({ success: false, message: error.message || 'Failed to fetch applications', error: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('helpers/states')
  @ApiOperation({ summary: 'Get States for Application Form', description: 'Get all available states for use in application forms' })
  @ApiResponse({ status: 200, description: 'States retrieved successfully' })
  async getStates() {
    try {
      const states = await this.applicationFormService.getStates();
      return { success: true, message: 'States retrieved successfully', data: states };
    } catch (error: any) {
      throw new HttpException({ success: false, message: error.message || 'Failed to fetch states', error: error.message }, HttpStatus.BAD_REQUEST);
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