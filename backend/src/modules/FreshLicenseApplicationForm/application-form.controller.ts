import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ApplicationFormService } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';
// import { CreateApplicationDto } from './dto/create-application.dto';
import { CreatePersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchApplicationDetailsDto } from './dto/patch-application-details.dto';
// import { LicensePurpose, FileType, Sex } from '@prisma/client';

@ApiTags('Application Form')
@Controller('application-form')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) { }
  @Post('personal-details')
  @ApiOperation({ summary: 'Create Personal Details (Step 1 separate table)', description: 'Create personal details in a dedicated table and return applicationId' })
  @ApiBody({
    type: CreatePersonalDetailsDto,
  })
  async createPersonalDetails(@Body() dto: CreatePersonalDetailsDto, @Request() req: any) {
    try {
      // Pass the DTO object directly to the service. The service expects a plain object
      const [error, applicationId] = await this.applicationFormService.createPersonalDetails(dto as any);
      if (error) {
        const errorMessage = typeof error === 'object' && error.message ? error.message : error;
        const errorDetails = typeof error === 'object' ? error : {};
        throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.BAD_REQUEST);
      }

      return { success: true, applicationId, message: 'Personal details saved' };
    } catch (err: any) {
      const errorMessage = err?.message || err;
      const errorDetails = err;
      throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':applicationId')
  @ApiOperation({ 
    summary: 'Update Application Details', 
    description: 'Update addresses, occupation, criminal history, license history, and license details for an existing application' 
  })
  @ApiParam({
    name: 'applicationId',
    description: 'Application ID',
    example: '123'
  })
  @ApiBody({
    type: PatchApplicationDetailsDto,
    description: 'Application details to update. All sections are optional - only provide the sections you want to update.',
    examples: {
      'Update Addresses Only': {
        value: {
          presentAddress: {
            addressLine: '123 Main Street, Block A',
            stateId: 1,
            districtId: 1,
            policeStationId: 1,
            zoneId: 1,
            divisionId: 1,
            sinceResiding: '2020-01-15T00:00:00.000Z',
            telephoneOffice: '033-12345678',
            officeMobileNumber: '9876543210'
          }
        }
      },
      'Update Criminal History Only': {
        value: {
          criminalHistories: [
            {
              isConvicted: false,
              isBondExecuted: false,
              isProhibited: false
            }
          ]
        }
      },
      'Update Multiple Sections': {
        value: {
          presentAddress: {
            addressLine: '123 Main Street, Block A',
            stateId: 1,
            districtId: 1,
            policeStationId: 1,
            zoneId: 1,
            divisionId: 1,
            sinceResiding: '2020-01-15T00:00:00.000Z'
          },
          occupationAndBusiness: {
            occupation: 'Software Engineer',
            officeAddress: '456 Corporate Plaza',
            stateId: 1,
            districtId: 1
          },
          licenseDetails: [
            {
              needForLicense: 'SELF_PROTECTION',
              armsCategory: 'RESTRICTED',
              requestedWeaponIds: [1, 2]
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Application details updated successfully',
    example: {
      success: true,
      message: 'Application details updated successfully',
      data: {
        updatedSections: ['presentAddress', 'criminalHistories'],
        application: {
          id: 123,
          acknowledgementNo: 'ALMS1696050000000',
          firstName: 'John',
          lastName: 'Doe',
          // ... other application data with relations
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or application not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate values or constraint violations' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async patchApplicationDetails(
    @Param('applicationId') applicationId: string,
    @Body() dto: PatchApplicationDetailsDto,
    @Request() req: any
  ) {
    try {
      const applicationIdNum = parseInt(applicationId, 10);
      if (isNaN(applicationIdNum)) {
        throw new HttpException(
          { success: false, error: 'Invalid application ID format' },
          HttpStatus.BAD_REQUEST
        );
      }

      const [error, result] = await this.applicationFormService.patchApplicationDetails(applicationIdNum, dto);
      
      if (error) {
        const errorMessage = typeof error === 'object' && error.message ? error.message : error;
        const errorDetails = typeof error === 'object' ? error : {};
        throw new HttpException(
          { success: false, error: errorMessage, details: errorDetails },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Application details updated successfully',
        data: result
      };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      
      const errorMessage = err?.message || err;
      const errorDetails = err;
      throw new HttpException(
        { success: false, error: errorMessage, details: errorDetails },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /*
  @Get()
  @ApiOperation({ summary: 'Get Applications', description: 'Retrieve applications with filtering, pagination, and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchField', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  @ApiQuery({ name: 'applicationId', required: false, type: String })
  @ApiQuery({ name: 'acknowledgementNo', required: false, type: String })
  @ApiQuery({ name: 'statusIds', required: false, type: String })
  @ApiQuery({ name: 'isOwned', required: false, type: String, default: false})
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  async getApplications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('searchField') searchField?: string,
    @Query('search') search?: string,
    @Query('orderBy') orderBy?: string,
    @Query('order') order?: string,
    @Query('applicationId') applicationId?: number,
    @Query('acknowledgementNo') acknowledgementNo?: string,
    @Query('statusIds') statusIds?: string,
    @Query('isOwned') isOwned?: String
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
      const parsedApplicationId = applicationId ? Number(applicationId) : undefined;
      const parsedAcknowledgementNo = acknowledgementNo ?? undefined;
  // Accept status identifiers as comma-separated values which can be numeric ids or textual codes/names.
  // We'll pass them to the service resolver which will return numeric IDs.
  const parsedStatusIdentifiers = statusIds ? statusIds.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  // Reusable address builder used for single-item and list-item transforms
  const buildAddress = (addr: any) => {
    if (!addr) return null;
    return {
      addressLine: addr.addressLine,
      sinceResiding: addr.sinceResiding,
      // Return only the name for state/district inside addresses per request
      state: addr.state ? addr.state.name : null,
      district: addr.district ? addr.district.name : null,
      zone: addr.zone ? { id: addr.zone.id, name: addr.zone.name } : null,
      division: addr.division ? { id: addr.division.id, name: addr.division.name } : null,
      policeStation: addr.policeStation ? { id: addr.policeStation.id, name: addr.policeStation.name } : null,
    };
  };

  if (parsedApplicationId || parsedAcknowledgementNo) {
        const [error, dataApplication] = await this.applicationFormService.getApplicationById(parsedApplicationId, parsedAcknowledgementNo);
        if (error) {
          const errMsg = (error as any)?.message || 'Failed to fetch applications';
          throw new HttpException({ success: false, message: errMsg, error: errMsg }, HttpStatus.BAD_REQUEST);
        }
        if (!dataApplication) {
          return { success: true, message: 'Application not found', data: [] };
        }

        // Build applicant name
        let applicantName = '';
        if (dataApplication.firstName) applicantName += dataApplication.firstName;
        if (dataApplication.middleName) applicantName += ` ${dataApplication.middleName}`;
        if (dataApplication.lastName) applicantName += ` ${dataApplication.lastName}`;

        const presentAddress = buildAddress(dataApplication.presentAddress);
        const permanentAddress = buildAddress(dataApplication.permanentAddress);

  // status -> return code string
  const status = dataApplication.status ? dataApplication.status.code : null;
  // Return state/district as name strings per request
  const state = dataApplication.state ? dataApplication.state.name : null;
  const district = dataApplication.district ? dataApplication.district.name : null;

        const currentUser = dataApplication.currentUser ? { id: dataApplication.currentUser.id, username: dataApplication.currentUser.username } : null;
        const previousUser = dataApplication.previousUser ? { id: dataApplication.previousUser.id, username: dataApplication.previousUser.username } : null;
        const currentRole = dataApplication.currentRole ? dataApplication.currentRole.code : null;
        const previousRole = dataApplication.previousRole ? dataApplication.previousRole.code : null;

        const transformed: any = {
          ...dataApplication,
          applicantName: applicantName.trim() || 'Unknown Applicant',
          presentAddress,
          permanentAddress,
          state,
          district,
          status,
          currentUser,
          previousUser,
          currentRole,
          previousRole,
        };

        // Remove raw id fields that should not be returned
        ['presentAddressId','permanentAddressId','contactInfoId','occupationInfoId','biometricDataId','statusId','currentRoleId','previousRoleId','currentUserId','previousUserId','stateId','districtId'].forEach(k => delete transformed[k]);

        return {
          success: true,
          message: 'Applications retrieved successfully',
          data: transformed,
        }
      }

      // Always use getFilteredApplications so usersInHierarchy is included
      const [error, result] = await this.applicationFormService.getFilteredApplications({
        page: pageNum,
        limit: limitNum,
        searchField: parsedSearchField,
        search: parsedSearchValue,
        orderBy: parsedOrderBy,
        order: parsedOrder as 'asc' | 'desc',
        currentUserId: req.user?.sub, // If you need user context
        // Resolve textual identifiers to numeric IDs if provided
        statusIds: parsedStatusIdentifiers && parsedStatusIdentifiers.length > 0
          ? await this.applicationFormService.resolveStatusIdentifiers(parsedStatusIdentifiers)
          : undefined,
        applicationId: parsedApplicationId,
        isOwned : isOwned == 'true' ? true : false,
      });
      if (error) {
        const errMsg = (error as any)?.message || 'Failed to fetch applications';
        throw new HttpException({ success: false, message: errMsg, error: errMsg }, HttpStatus.BAD_REQUEST);
      }

      const typedResult = result as { data: any[]; total: number; usersInHierarchy?: any[] };

      // The service already returns transformed rows and a combined usersInHierarchy
      return {
        success: true,
        message: 'Applications retrieved successfully',
        data: typedResult.data,
        usersInHierarchy: typedResult.usersInHierarchy ?? [],
        pagination: {
          total: typedResult.total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(typedResult.total / (limitNum || 10)),
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
  })
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
  } */

 /* @Get('helpers/check-aadhar/:aadharNumber')
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
  }*/
}