import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ApplicationFormService } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';
import { CreateApplicationDto } from './dto/create-application.dto';
import { LicensePurpose, WeaponCategory, FileType, Sex } from '@prisma/client';

@ApiTags('Application Form')
@Controller('application-form')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) { }

  @Post()
  @ApiOperation({
    summary: 'Create Application',
    description: `Create a new fresh license application.`
  })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            acknowledgementNo: { type: 'string', example: 'ACK123456789' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
        details: { type: 'object' }
      }
    }
  })
  async createApplication(@Body() applicationData: CreateApplicationDto, @Request() req: any) {
    try {
      // Convert DTO to service input format
      const processedData = {
        statusId: applicationData.statusId,
        firstName: applicationData.firstName,
        middleName: applicationData.middleName,
        lastName: applicationData.lastName,
        filledBy: applicationData.filledBy,
        parentOrSpouseName: applicationData.parentOrSpouseName,
        sex: applicationData.sex as Sex,
        placeOfBirth: applicationData.placeOfBirth,
        dateOfBirth: new Date(applicationData.dateOfBirth),
        panNumber: applicationData.panNumber,
        aadharNumber: applicationData.aadharNumber,
        dobInWords: applicationData.dobInWords,
        stateId: applicationData.stateId,
        districtId: applicationData.districtId,
        currentUserId: applicationData.currentUserId,
        currentRoleId: applicationData.currentRoleId,

        presentAddress: {
          addressLine: applicationData.presentAddress.addressLine,
          stateId: applicationData.presentAddress.stateId,
          districtId: applicationData.presentAddress.districtId,
          zoneId: applicationData.permanentAddress.zoneId,
          divisionId: applicationData.permanentAddress.divisionId,
          policeStationId: applicationData.presentAddress.policeStationId,
          sinceResiding: new Date(applicationData.presentAddress.sinceResiding)
        },

        permanentAddress: applicationData.permanentAddress ? {
          addressLine: applicationData.permanentAddress.addressLine,
          stateId: applicationData.permanentAddress.stateId,
          districtId: applicationData.permanentAddress.districtId,
          zoneId: applicationData.permanentAddress.zoneId,
          divisionId: applicationData.permanentAddress.divisionId,
          policeStationId: applicationData.permanentAddress.policeStationId,
          sinceResiding: new Date(applicationData.permanentAddress.sinceResiding)
        } : undefined,

        contactInfo: applicationData.contactInfo,
        occupationInfo: applicationData.occupationInfo,
        biometricData: applicationData.biometricData,

        // Convert criminal history to expected format
        criminalHistory: applicationData.criminalHistory?.map(ch => ({
          convicted: ch.convicted,
          convictionData: {
            isCriminalCasePending: ch.isCriminalCasePending,
            firNumber: ch.firNumber,
            policeStation: ch.policeStation,
            sectionOfLaw: ch.sectionOfLaw,
            dateOfOffence: ch.dateOfOffence,
            caseStatus: ch.caseStatus
          }
        })),

        // Convert license history to expected format
        licenseHistory: applicationData.licenseHistory?.map(lh => ({
          hasAppliedBefore: lh.hasAppliedBefore,
          hasOtherApplications: lh.hasOtherApplications,
          familyMemberHasArmsLicense: lh.familyMemberHasArmsLicense,
          hasSafePlaceForArms: lh.hasSafePlaceForArms,
          hasUndergoneTraining: lh.hasUndergoneTraining,
          previousApplications: {
            hasPreviousLicense: lh.hasPreviousLicense,
            previousLicenseNumber: lh.previousLicenseNumber,
            licenseIssueDate: lh.licenseIssueDate,
            licenseExpiryDate: lh.licenseExpiryDate,
            issuingAuthority: lh.issuingAuthority,
            isLicenseRenewed: lh.isLicenseRenewed,
            renewalDate: lh.renewalDate,
            renewingAuthority: lh.renewingAuthority
          }
        })),

        licenseRequestDetails: {
          needForLicense: applicationData.licenseRequestDetails.needForLicense as LicensePurpose,
          weaponCategory: applicationData.licenseRequestDetails.weaponCategory as WeaponCategory,
          requestedWeaponIds: applicationData.licenseRequestDetails.requestedWeaponIds,
          areaOfValidity: applicationData.licenseRequestDetails.areaOfValidity
        },

        fileUploads: applicationData.fileUploads?.map(fu => ({
          fileName: fu.fileName,
          fileSize: fu.fileSize,
          fileType: fu.fileType as FileType,
          fileUrl: fu.fileUrl
        }))
      };

      const [error, result] = await this.applicationFormService.createApplication(processedData);
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
  @ApiQuery({ name: 'applicationId', required: false, type: String })
  @ApiQuery({ name: 'acknowledgementNo', required: false, type: String })
  @ApiQuery({ name: 'statusIds', required: false, type: String })
  @ApiQuery({ name: 'isOwned', required: false, type: Boolean, default: false})
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
    @Query('isOwned') isOwned?: Boolean,
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
      const parsedStatusIds = statusIds ? statusIds.split(',').map(id => Number(id.trim())) : undefined;
      if (parsedApplicationId || parsedAcknowledgementNo) {
        const [error, dataApplication] = await this.applicationFormService.getApplicationById(parsedApplicationId, parsedAcknowledgementNo);
        if (error) {
          const errMsg = (error as any)?.message || 'Failed to fetch applications';
          throw new HttpException({ success: false, message: errMsg, error: errMsg }, HttpStatus.BAD_REQUEST);
        }
        // dataApplication.applicantName = `${dataApplication?.firstName} ${dataApplication?.middleName ? dataApplication?.middleName + ' ' : ''}${dataApplication?.lastName}`;
        let applicantName 
        if (dataApplication) { 
          if (dataApplication.firstName) applicantName = dataApplication.firstName;
          if (dataApplication.middleName) applicantName += ` ${dataApplication.middleName}`;
          if (dataApplication.lastName) applicantName += ` ${dataApplication.lastName}`;
          dataApplication.applicantName = applicantName || 'Unknown Applicant';
        } else {
          return {
            success: true,
            message: "Application not found",
            data: []
          }
        }
        return {
          success: true,
          message: 'Applications retrieved successfully',
          data: dataApplication,
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
        statusIds: parsedStatusIds,
        applicationId: parsedApplicationId,
        isOwned : isOwned == true ? true : false,
      });
      if (error) {
        const errMsg = (error as any)?.message || 'Failed to fetch applications';
        throw new HttpException({ success: false, message: errMsg, error: errMsg }, HttpStatus.BAD_REQUEST);
      }

      const typedResult = result as { data: any[]; total: number; usersInHierarchy?: any[] };
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