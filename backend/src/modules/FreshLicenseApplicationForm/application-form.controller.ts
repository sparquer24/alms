import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ApplicationFormService } from './application-form.service';
import { AuthGuard } from '../../middleware/auth.middleware';
// import { CreateApplicationDto } from './dto/create-application.dto';
import { CreatePersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchApplicationDetailsDto } from './dto/patch-application-details.dto';
import { UploadFileDto, UploadFileResponseDto } from './dto/upload-file.dto';
// import { LicensePurpose, FileType, Sex } from '@prisma/client';

@ApiTags('Application Form')
@Controller('application-form')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApplicationFormController {
  constructor(private readonly applicationFormService: ApplicationFormService) { }
  @Post('personal-details')
  @ApiOperation({ 
    summary: 'Create Personal Details (Step 1 separate table)', 
    description: 'Create personal details in a dedicated table and return applicationId. Application status is automatically set to DRAFT.' 
  })
  @ApiBody({
    type: CreatePersonalDetailsDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Personal details created successfully with DRAFT status',
    example: {
      success: true,
      applicationId: 123,
      message: 'Personal details saved with DRAFT status'
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or DRAFT status not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createPersonalDetails(@Body() dto: CreatePersonalDetailsDto, @Request() req: any) {
    try {
  // Pass the DTO object directly to the service, and include the authenticated user id so
  // the service can set currentUserId/currentRoleId on creation when available.
  const payload = { ...(dto as any), currentUserId: req.user?.sub };
  const [error, applicationId] = await this.applicationFormService.createPersonalDetails(payload);
      if (error) {
        const errorMessage = typeof error === 'object' && error.message ? error.message : error;
        const errorDetails = typeof error === 'object' ? error : {};
        throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.BAD_REQUEST);
      }

      return { success: true, applicationId, message: 'Personal details saved with DRAFT status' };
    } catch (err: any) {
      const errorMessage = err?.message || err;
      const errorDetails = err;
      throw new HttpException({ success: false, error: errorMessage, details: errorDetails }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch()
  @ApiOperation({ 
    summary: 'Update Application Details', 
    description: 'Update addresses, occupation, criminal history, license history, and license details for an existing application' 
  })
  @ApiQuery({
    name: 'applicationId',
    description: 'Application ID',
    example: '123'
  })
    @ApiQuery({
    name: 'isSubmit',
    description: 'Set to true to submit the application (finalize). If true, declaration and terms must be accepted.',
    example: false,
    required: false,
  })
  @ApiBody({
    type: PatchApplicationDetailsDto,
    description: 'Application details to update. All sections are optional - only provide the sections you want to update.',
    examples: {
      'Complete Address Update': {
        summary: 'Update both present and permanent addresses with full details',
        value: {
          presentAddress: {
            addressLine: '123 Main Street, Block A, Flat 4B',
            stateId: 1,
            districtId: 1,
            policeStationId: 1,
            zoneId: 1,
            divisionId: 1,
            sinceResiding: '2020-01-15T00:00:00.000Z',
            telephoneOffice: '033-12345678',
            officeMobileNumber: '9876543210',
            alternativeMobile: '9876543211'
          },
          permanentAddress: {
            addressLine: '456 Village Road, House No. 12',
            stateId: 1,
            districtId: 2,
            policeStationId: 2,
            zoneId: 2,
            divisionId: 2,
            sinceResiding: '1990-05-20T00:00:00.000Z',
            telephoneOffice: '033-87654321',
            officeMobileNumber: '9123456789',
            alternativeMobile: '9123456790'
          }
        }
      },
      'Submit the application': {
        summary: '',
        value: {
          isDeclarationAccepted: true,
          isAwareOfLegalConsequences: true,
          isTermsAccepted: true
        }
      },
      'Personal Details Update': {
        summary: 'Update applicant personal details (name, aadhar, PAN, DOB, etc.)',
        value: {
          personalDetails: {
            firstName: 'Jane',
            middleName: 'M',
            lastName: 'Doe',
            parentOrSpouseName: 'Janet Doe',
            sex: 'FEMALE',
            dateOfBirth: '1992-08-15T00:00:00.000Z',
            aadharNumber: '123456789012',
            panNumber: 'ABCDE1234F',
          }
        }
      },
      'Occupation and Business Details': {
        summary: 'Update complete occupation and business information',
        value: {
          occupationAndBusiness: {
            occupation: 'Software Engineer',
            officeAddress: '456 Corporate Plaza, IT Park, Sector V',
            stateId: 1,
            districtId: 1,
            cropLocation: 'Village ABC, Block XYZ (for farmers only)',
            areaUnderCultivation: 5.5
          }
        }
      },
      'Complete Criminal History': {
        summary: 'Update criminal history with all possible fields',
        value: {
          criminalHistories: [
            {
              isConvicted: false,
              isBondExecuted: false,
              bondDate: '2019-03-20T00:00:00.000Z',
              bondPeriod: '6 months',
              isProhibited: false,
              prohibitionDate: '2020-07-10T00:00:00.000Z',
              prohibitionPeriod: '5 years',
              // Example FIR details array
              firDetails: [
                { firNumber: '123/2018', underSection: '35', policeStation: 'Central PS', unit: '2/3', District: 'Hyderabad', state: 'Telangana', offence: '', sentence: '', DateOfSentence: '2020-07-10T00:00:00.000Z' }
              ]
            }
          ]
        }
      },
      'Complete License History': {
        summary: 'Update license history with all possible fields',
        value: {
          licenseHistories: [
            {
              hasAppliedBefore: true,
              dateAppliedFor: '2019-06-15T00:00:00.000Z',
              previousAuthorityName: 'District Magistrate, Kolkata',
              previousResult: 'REJECTED',
              hasLicenceSuspended: false,
              suspensionAuthorityName: 'District Magistrate, Mumbai',
              suspensionReason: 'Violation of terms and conditions',
              hasFamilyLicence: true,
              familyMemberName: 'John Doe (Father)',
              familyLicenceNumber: 'LIC123456789',
              familyWeaponsEndorsed: ['Pistol .32', 'Rifle .22'],
              hasSafePlace: true,
              safePlaceDetails: 'Steel almirah with double lock in bedroom',
              hasTraining: true,
              trainingDetails: 'Basic firearms training from XYZ Academy, Certificate No: ABC123'
            }
          ]
        }
      },
      'Complete License Details': {
        summary: 'Update license details with all possible fields',
        value: {
          licenseDetails: [
            {
              needForLicense: 'SELF_PROTECTION',
              armsCategory: 'RESTRICTED',
              requestedWeaponIds: [1, 2, 3],
              areaOfValidity: 'District-wide',
              ammunitionDescription: '50 rounds of .32 ammunition',
              specialConsiderationReason: 'Required for personal protection due to threats',
              licencePlaceArea: 'Urban areas of Kolkata district',
              wildBeastsSpecification: 'Wild boars, leopards as per Wildlife Protection Act Schedule'
            }
          ]
        }
      },
      'No Criminal Record': {
        summary: 'Clean criminal history record',
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
      'First Time Applicant': {
        summary: 'License history for first-time applicant',
        value: {
          licenseHistories: [
            {
              hasAppliedBefore: false,
              hasLicenceSuspended: false,
              hasFamilyLicence: false,
              hasSafePlace: true,
              safePlaceDetails: 'Steel almirah with double lock system',
              hasTraining: false
            }
          ]
        }
      },
      'Complete Application Update': {
        summary: 'Update all sections with comprehensive data',
        value: {
          presentAddress: {
            addressLine: '123 Main Street, Block A, Flat 4B',
            stateId: 1,
            districtId: 1,
            policeStationId: 1,
            zoneId: 1,
            divisionId: 1,
            sinceResiding: '2020-01-15T00:00:00.000Z',
            telephoneOffice: '033-12345678',
            officeMobileNumber: '9876543210',
            alternativeMobile: '9876543211'
          },
          permanentAddress: {
            addressLine: '456 Village Road, House No. 12',
            stateId: 1,
            districtId: 2,
            policeStationId: 2,
            zoneId: 2,
            divisionId: 2,
            sinceResiding: '1990-05-20T00:00:00.000Z',
            telephoneOffice: '033-87654321',
            officeMobileNumber: '9123456789'
          },
          occupationAndBusiness: {
            occupation: 'Business Owner',
            officeAddress: '789 Business Complex, Commercial Area',
            stateId: 1,
            districtId: 1,
            cropLocation: 'Agricultural land in Block DEF',
            areaUnderCultivation: 12.25
          },
          criminalHistories: [
            {
              isConvicted: false,
              isBondExecuted: false,
              isProhibited: false,
              firDetails: []
            }
          ],
          licenseHistories: [
            {
              hasAppliedBefore: false,
              hasLicenceSuspended: false,
              hasFamilyLicence: false,
              hasSafePlace: true,
              safePlaceDetails: 'Fire-proof steel safe with digital lock',
              hasTraining: true,
              trainingDetails: 'Professional firearms training from ABC Institute'
            }
          ],
          licenseDetails: [
            {
              needForLicense: 'CROP_PROTECTION',
              armsCategory: 'NON_PROHIBITED',
              requestedWeaponIds: [4, 5],
              areaOfValidity: 'Within district boundaries',
              ammunitionDescription: '100 rounds of .22 caliber ammunition',
              specialConsiderationReason: 'Crop protection from wild animals',
              licencePlaceArea: 'Rural agricultural areas of district',
              wildBeastsSpecification: 'Wild boars, deer, and other crop-damaging animals'
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
    @Query('applicationId') applicationId: string,
    @Query('isSubmit') isSubmit: boolean,
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

  // Coerce isSubmit query param into boolean 
  const isSubmitBool = Boolean(isSubmit);

  const [error, result] = await this.applicationFormService.patchApplicationDetails(applicationIdNum, isSubmitBool, dto);
      
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

  @Post(':applicationId/upload-file')
  @ApiOperation({ 
    summary: 'Store file URL for application', 
    description: 'Store file URL and metadata for a specific application. The file should already be uploaded to a file storage service.' 
  })
  @ApiParam({
    name: 'applicationId',
    description: 'Application ID',
    example: '123'
  })
  @ApiBody({
    type: UploadFileDto,
    description: 'File metadata including URL, type, name, and size',
    examples: {
      'Aadhar Card': {
        value: {
          fileType: 'AADHAR_CARD',
          fileUrl: 'https://example.com/files/aadhar_card.pdf',
          fileName: 'aadhar_card.pdf',
          fileSize: 2048576,
          description: 'Front side of Aadhar card'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadFileResponseDto,
    example: {
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: 1,
        applicationId: 123,
        fileType: 'AADHAR_CARD',
        fileName: 'aadhar_card.pdf',
        fileUrl: 'uploads/application-123/files/AADHAR_CARD_1696507200000_aadhar_card.pdf',
        fileSize: 2048576,
        uploadedAt: '2023-10-05T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or application ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadFile(
    @Param('applicationId') applicationId: string,
    @Body() dto: UploadFileDto,
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

      const [error, result] = await this.applicationFormService.uploadFile(applicationIdNum, dto);

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
        message: 'File uploaded successfully',
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
    @Query('isOwned') isOwned?: Boolean
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
  const 
  parsedStatusIdentifiers = statusIds ? statusIds.split(',').map(s => s.trim()).filter(Boolean) : undefined;

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
        // applicationId: parsedApplicationId,
        isOwned : isOwned == true? true : false,
      });
      if (error) {
        const errMsg = (error as any)?.message || 'Failed to fetch applications--------------584';
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
      throw new HttpException({ success: false, message: error.message || 'Failed to fetch applications------------------605', error: error.message }, HttpStatus.BAD_REQUEST);
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