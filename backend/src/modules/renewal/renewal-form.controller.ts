import { Controller, Get, Post, Body, Param, Query, Delete, Patch, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery, ApiParam, ApiCreatedResponse, ApiOkResponse,} from '@nestjs/swagger';
import { RenewalFormService } from './renewal-form.service';
import { CreateRenewalPersonalDetailsDto } from './dto/create-personal-details.dto';
import { PatchRenewalApplicationDetailsDto } from './dto/patch-application-details.dto';
import { UploadRenewalFileDto, UploadRenewalFileResponseDto } from './dto/upload-file.dto';
import { GetRenewalApplicationsDto } from './dto/get-applications.dto';
import { MergeLicenseDto, MergeResponseDto } from './dto/merge-license.dto';
import { RenewalFormResponse } from '../../request/renewal-form';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { AuthGuard } from '../../middleware/auth.middleware';
import { ParseIntPipe } from '@nestjs/common';

@ApiTags('Renewal Forms')
@Controller('renewal-forms')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class RenewalFormController {
  constructor(private readonly renewalFormService: RenewalFormService) { }

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
  @ApiCreatedResponse({
    description: 'Renewal form created successfully',
    type: RenewalFormResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or license already has renewal' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createRenewalForm(
    @Body() createRequest: CreateRenewalPersonalDetailsDto,
    @Request() req: any,
  ): Promise<RenewalFormResponse> {
    try {
      const userId = Number(req.user?.sub || req.body.currentUserId);
      if (!userId || Number.isNaN(userId)) {
        throw new Error('Authenticated user ID is missing or invalid');
      }
      return this.renewalFormService.createPersonalDetails(createRequest, userId);
    } catch (error) {
      console.error('Error creating renewal form:', error);
      throw error;
    }
  }
  /**
   * Update application details (addresses, occupation, license details, biometrics)
   * Can be used for multiple steps to gradually fill the form
   */
  @Patch()
  @ApiOperation({
    summary: 'Update renewal application details',
    description: 'Update addresses, occupation, license details, biometrics and other sections',
  })
  @ApiQuery({
    name: 'applicationId',
    type: Number,
    description: 'Application ID to update',
    example: 1,
  })
  @ApiQuery({
    name: 'isSubmit',
    example: 'false',
    required: false,
    type: Boolean,
    description: 'Whether to submit the application after update',
  })
  @ApiBody({
    type: PatchRenewalApplicationDetailsDto,
    description: 'Application details to update',
    examples: {
      'Update Personal, Address, Occupation and License Details': {
        summary: 'Update multiple sections of the application',
        value: {
          "personalDetails": {
            "firstName": "XYZ",
            "middleName": "K",
            "lastName": "Sharma",
            "parentOrSpouseName": "Ramesh Sharma",
            "sex": "MALE",
            "dateOfBirth": "1985-05-15",
            "dobInWords": "Fifteenth May Nineteen Eighty Five",
            "panNumber": "ABCPD1234F",
            "aadharNumber": "123456789012"
          },
          "addressDetails": {
            "addressLine": "123 Main Street, Block A",
            "stateId": 1,
            "districtId": 1,
            "policeStationId": 1,
            "zoneId": 1,
            "divisionId": 1,
            "sinceResiding": "2020-05-15",
            "telephoneOffice": "+91-1234567890",
            "telephoneResidence": "+91-0987654321",
            "officeMobileNumber": "+91-9876543210",
            "alternativeMobile": "+91-9123456789"
          },
          "occupationAndBusiness": {
            "occupation": "Farmer",
            "officeAddress": "123 Market Street",
            "stateId": 1,
            "districtId": 1,
            "cropLocation": "Plot 123, Village XYZ",
            "areaUnderCultivation": 10.5
          },
          "licenseDetails": {
            "needForLicense": "SELF_PROTECTION",
            "armsCategory": "RESTRICTED",
            "areaOfValidity": "DISTRICT",
            "ammunitionDescription": "10 rounds per month",
            "specialConsiderationReason": "High crime area",
            "licencePlaceArea": "Residence",
            "requestedWeaponIds": [
              1,
              2,
              3
            ]
          },
          "acceptanceFlags": {},
          "isSubmit": true
        }
      },
      'Complete Criminal History': {
        summary: 'Update criminal history with all possible fields',
        value: {
          criminalHistories: [
            {
              isConvicted: true,
              firDetails: [
                { firNumber: '123/2018', underSection: '302', policeStation: 'Central PS', unit: '2/3', District: 'Hyderabad', state: 'Telangana', offence: 'Rioting', sentence: '2 years', DateOfSentence: '2020-07-10T00:00:00.000Z' }
              ],
              isBondExecuted: true,
              bondDate: '2019-03-20T00:00:00.000Z',
              bondPeriod: '6 months',
              isProhibited: true,
              prohibitionDate: '2020-07-10T00:00:00.000Z',
              prohibitionPeriod: '5 years'
            }
          ]
        }
      },
      'No Criminal Record': {
        summary: 'Clear criminal history (set all to false)',
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
      'Complete License History': {
        summary: 'Update license history with all possible fields',
        value: {
          licenseHistories: [
            {
              hasAppliedBefore: true,
              dateAppliedFor: '2019-06-15T00:00:00.000Z',
              previousAuthorityName: 'District Magistrate, Kolkata',
              previousResult: 'REJECTED',
              hasLicenceSuspended: true,
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
      'First Time Applicant (License History)': {
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
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Application details updated successfully',
    example: {
      success: true,
      message: 'Application details updated successfully',
      data: {
        updatedSections: ['presentAddress', 'criminalHistories', 'licenseHistories'],
        application: {
          id: 1,
          acknowledgementNo: 'RENEWAL-1715754373000-12345678',
          firstName: 'XYZ',
          middleName: 'K',
          lastName: 'Sharma',
          parentOrSpouseName: 'Ramesh Sharma',
          sex: 'MALE',
          dateOfBirth: '1985-05-15T00:00:00.000Z',
          licenseNumber: 'LIC123456789',
          criminalHistories: [
            {
              id: 1,
              applicationId: 1,
              isConvicted: true,
              firDetails: [
                { firNumber: '123/2018', underSection: '302', policeStation: 'Central PS', unit: '2/3', District: 'Hyderabad', state: 'Telangana', offence: 'Rioting', sentence: '2 years', DateOfSentence: '2020-07-10T00:00:00.000Z' }
              ],
              isBondExecuted: true,
              bondDate: '2019-03-20T00:00:00.000Z',
              bondPeriod: '6 months',
              isProhibited: true,
              prohibitionDate: '2020-07-10T00:00:00.000Z',
              prohibitionPeriod: '5 years',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            }
          ],
          licenseHistories: [
            {
              id: 1,
              applicationId: 1,
              hasAppliedBefore: true,
              dateAppliedFor: '2019-06-15T00:00:00.000Z',
              previousAuthorityName: 'District Magistrate, Kolkata',
              previousResult: 'REJECTED',
              hasLicenceSuspended: false,
              suspensionAuthorityName: null,
              suspensionReason: null,
              hasFamilyLicence: true,
              familyMemberName: 'John Doe (Father)',
              familyLicenceNumber: 'LIC123456789',
              familyWeaponsEndorsed: ['Pistol .32', 'Rifle .22'],
              hasSafePlace: true,
              safePlaceDetails: 'Steel almirah with double lock in bedroom',
              hasTraining: true,
              trainingDetails: 'Basic firearms training from XYZ Academy, Certificate No: ABC123',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            }
          ],
          workflowStatus: { id: 1, code: 'DRAFT', name: 'Draft' },
          isSubmit: false
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid data or application is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateApplicationDetails(
    @Query('applicationId') applicationId: number,
    @Body() patchData: PatchRenewalApplicationDetailsDto,
    @Request() req: any,
    @Query('isSubmit') isSubmit?: string,
    
  ): Promise<RenewalFormResponse> {
    const userId = Number(req?.user?.sub || req?.user?.user_id);
    const submitApp = isSubmit !== undefined ? isSubmit === 'true' : patchData.isSubmit === true

    const result = await this.renewalFormService.patchApplicationDetails(
      applicationId,
      { ...patchData, isSubmit: submitApp },
      userId,
    );
    return result;
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
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() uploadData: UploadRenewalFileDto,
  ): Promise<UploadRenewalFileResponseDto> {
    // Validate MIME type based on file extension
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'doc', 'docx', 'xls', 'xlsx'];
    const fileExt = uploadData.fileName?.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(`File type '.${fileExt || 'unknown'}' is not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
    }
    return this.renewalFormService.uploadFile(applicationId, uploadData);
  }

  /**
   * Delete a file from renewal application
   */
  @Delete('/file/:fileId')
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
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'File deleted successfully',
        data: {
          fileId: 1315
        }
      }
    }
  }) 
  @ApiResponse({ status: 400, description: 'Cannot delete file from non-DRAFT application' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteFile(@Param('fileId', ParseIntPipe) fileId: number): Promise<any> {
    await this.renewalFormService.deleteFile(fileId);
    return {
      success: true,
      message: 'File deleted successfully',
      data: { fileId },
    };
  }

  /**
   * Delete entire renewal application
   * Only allowed for DRAFT status applications
   */
  @Delete('/application/:applicationId')
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
    status: 200,
    description: 'Application deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Application deleted successfully',
        data: {
          applicationId: 58
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Application is not in DRAFT status' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteApplication(@Param('applicationId') applicationId: string): Promise<any> {
    const applId = parseInt(applicationId, 10);
    await this.renewalFormService.deleteApplicationById(applId);
    return {
      success: true,
      message: 'Application deleted successfully',
      data: { applicationId: applId },
    };
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

  /**
   * Get merge audit logs with pagination and filtering
   */
  @Get('merge-audit-logs/all')
  @ApiOperation({
    summary: 'Get all merge audit logs',
    description: 'Retrieve all merge audit logs with pagination and filtering',
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
    name: 'mergeId',
    required: false,
    type: String,
    description: 'Filter by merge ID',
  })
  @ApiQuery({
    name: 'freshLicenseId',
    required: false,
    type: Number,
    description: 'Filter by fresh license ID',
  })
  @ApiQuery({
    name: 'renewalLicenseId',
    required: false,
    type: Number,
    description: 'Filter by renewal license ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by merge status',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMergeAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query() filters?: any,
  ): Promise<any> {
    return this.renewalFormService.getMergeAuditLogs(page || 1, limit || 10, filters);
  }

  /**
   * Get a specific merge audit log by merge ID
   */
  @Get('merge-audit-logs/:mergeId')
  @ApiOperation({
    summary: 'Get merge audit log by ID',
    description: 'Retrieve a specific merge audit log by merge ID',
  })
  @ApiParam({
    name: 'mergeId',
    type: String,
    description: 'Merge ID (e.g., MERGE-1779191518061-72453e46)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Merge audit log not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getMergeAuditLogByMergeId(
    @Param('mergeId') mergeId: string,
  ): Promise<any> {
    return this.renewalFormService.getMergeAuditLogByMergeId(mergeId);
  }

  /**
   * Merge renewal license data into fresh license record
   * Only JTCP and CP roles can access this endpoint
   */
  @Post('approved/merge')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Merge renewal license into fresh license',
    description: 'Merge renewal license data into an existing fresh license record. Only users with JTCP or CP roles can perform this operation.',
  })
  @ApiBody({
    type: MergeLicenseDto,
    description: 'IDs for the licenses to merge',
    examples: {
      'Merge Renewal to Fresh License': {
        summary: 'Merge renewal form 5 into fresh license 1',
        value: {
          freshLicenseId: 1,
          renewalLicenseId: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Licenses merged successfully',
    type: MergeResponseDto,
    example: {
      success: true,
      message: 'Renewal license successfully merged into fresh license',
      data: {
        mergeId: 'MERGE-1715754373000-12345678',
        freshLicenseId: 1,
        renewalLicenseId: 5,
        mergedFields: ['firstName', 'lastName', 'dateOfBirth', 'aadharNumber', 'panNumber', 'presentAddress', 'occupationAndBusiness', 'licenseDetails'],
        mergedAt: '2024-05-15T11:15:30.000Z',
        mergedBy: 2,
        freshLicenseUpdated: {
          id: 1,
          acknowledgementNo: 'ALMS1696050000000',
          firstName: 'Jane',
          lastName: 'Smith',
          sex: 'FEMALE',
          dateOfBirth: '1992-08-15T00:00:00.000Z',
          aadharNumber: '123456789012',
          panNumber: 'ABCDE1234F',
          workflowStatus: {
            id: 1,
            code: 'DRAFT',
            name: 'Draft',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid IDs or validation failed',
    example: {
      statusCode: 400,
      message: 'Fresh license with ID 999 not found',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized - User does not have required role (JTCP or CP)',
    example: {
      statusCode: 403,
      message: 'Access denied. Required roles: JTCP, CP',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fresh license or renewal license not found',
    example: {
      statusCode: 404,
      message: 'Renewal license with ID 5 not found',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during merge',
    example: {
      statusCode: 500,
      message: 'An error occurred while merging licenses',
      error: 'Internal Server Error',
    },
  })
  @ApiBearerAuth('JWT-auth')
  async mergeLicenses(
    @Body() mergeData: MergeLicenseDto,
    @Request() req: any,
  ): Promise<MergeResponseDto> {
    try {
      // Check user role - handles multiple JWT role structures
      const allowedRoles = ['JTCP', 'CP'];
      
      // Try multiple ways to extract roles from JWT
      let userRoles: string[] = [];
      
      // Method 1: Check req.user.roleCode (set by JwtAuthGuard from role_code in token)
      if (req.user?.roleCode && typeof req.user.roleCode === 'string') {
        userRoles = [req.user.roleCode];
      }
      
      // Method 2: Check req.user.roles (array of objects)
      if (!userRoles.length && req.user?.roles && Array.isArray(req.user.roles)) {
        userRoles = req.user.roles.map((role: any) => 
          role?.code || role?.name || role
        ).filter((r: any) => r);
      }
      
      // Method 3: Check req.user.role (single string)
      if (!userRoles.length && req.user?.role && typeof req.user.role === 'string') {
        userRoles = [req.user.role];
      }
      
      // Method 4: Check req.user.userRole (single string)
      if (!userRoles.length && req.user?.userRole && typeof req.user.userRole === 'string') {
        userRoles = [req.user.userRole];
      }
      
      // Method 5: Check req.user.user_role (snake_case)
      if (!userRoles.length && (req.user as any)?.user_role && typeof (req.user as any).user_role === 'string') {
        userRoles = [(req.user as any).user_role];
      }
      
      // Method 6: Check req.user.permissions
      if (!userRoles.length && req.user?.permissions && Array.isArray(req.user.permissions)) {
        userRoles = req.user.permissions.map((perm: any) =>
          perm?.code || perm?.name || perm
        ).filter((p: any) => p);
      }

      const hasRequiredRole = userRoles.some((role: any) =>
        allowedRoles.includes(role?.toString().toUpperCase())
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${allowedRoles.join(', ')}. Your roles: ${userRoles.length > 0 ? userRoles.join(', ') : 'NONE'}`
        );
      }

      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        throw new ForbiddenException('User ID not found in token');
      }
      return await this.renewalFormService.mergeLicenses(
        mergeData.freshLicenseId,
        mergeData.renewalLicenseId,
        userId,
      );
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }
}
