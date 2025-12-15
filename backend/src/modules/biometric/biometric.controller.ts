import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BiometricService } from './biometric.service';
import { BiometricEnrollmentDto, BiometricVerificationDto } from './dto/biometric.dto';
import { AuthGuard } from '../../middleware/auth.middleware';

@ApiTags('Biometric')
@Controller('biometric')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class BiometricController {
    constructor(private readonly biometricService: BiometricService) { }

    /**
     * Device Status Check
     */
    @Post('device/status')
    @ApiOperation({ summary: 'Check biometric device status' })
    @ApiResponse({
        status: 200,
        description: 'Device status retrieved',
        example: {
            isConnected: true,
            message: 'Device is ready',
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async checkDeviceStatus(@Body() body: { applicantId: string }) {
        // This endpoint would typically call a service that checks
        // the Mantra SDK service status on the user's machine
        // For now, return a placeholder response
        return {
            success: true,
            isConnected: true,
            message: 'Device status check endpoint available. Configure on frontend.',
        };
    }

    /**
     * Enroll Fingerprint
     */
    @Post('enroll/:applicantId')
    @ApiParam({ name: 'applicantId', description: 'Application ID' })
    @ApiOperation({ summary: 'Enroll fingerprint for an applicant' })
    @ApiResponse({
        status: 201,
        description: 'Fingerprint enrolled successfully',
        example: {
            success: true,
            fingerprintId: 'abc123def456',
            message: 'Fingerprint enrolled successfully at position RIGHT_THUMB',
            enrolledAt: '2025-12-15T10:30:00Z',
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async enrollFingerprint(
        @Param('applicantId') applicantId: string,
        @Body() enrollmentData: BiometricEnrollmentDto,
        @Request() req: any,
    ) {
        try {
            const result = await this.biometricService.enrollFingerprint(
                applicantId,
                enrollmentData,
                req.user?.sub || 0,
            );
            return result;
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Verify Fingerprint
     */
    @Post('verify/:applicantId')
    @ApiParam({ name: 'applicantId', description: 'Application ID' })
    @ApiOperation({ summary: 'Verify fingerprint against enrolled templates' })
    @ApiResponse({
        status: 200,
        description: 'Verification completed',
        example: {
            success: true,
            isMatch: true,
            matchScore: 87,
            matchedFingerPosition: 'RIGHT_THUMB',
            message: 'Fingerprint matched at position: RIGHT_THUMB',
        },
    })
    @ApiResponse({ status: 400, description: 'No enrolled fingerprints' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async verifyFingerprint(
        @Param('applicantId') applicantId: string,
        @Body() verificationData: BiometricVerificationDto,
        @Request() req: any,
    ) {
        try {
            const result = await this.biometricService.verifyFingerprint(
                applicantId,
                verificationData,
                req.user?.sub || 0,
            );
            return result;
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get Enrolled Fingerprints
     */
    @Get('enrolled/:applicantId')
    @ApiParam({ name: 'applicantId', description: 'Application ID' })
    @ApiOperation({ summary: 'Get enrolled fingerprints for an applicant' })
    @ApiResponse({
        status: 200,
        description: 'List of enrolled fingerprints',
        example: {
            success: true,
            data: [
                {
                    id: 'abc123',
                    position: 'RIGHT_THUMB',
                    quality: 95,
                    enrolledAt: '2025-12-15T10:30:00Z',
                    description: 'Fingerprint - RIGHT_THUMB',
                },
            ],
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async getEnrolledFingerprints(@Param('applicantId') applicantId: string) {
        try {
            const fingerprints = await this.biometricService.getEnrolledFingerprints(applicantId);
            return { success: true, data: fingerprints };
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Delete Enrolled Fingerprint
     */
    @Delete(':applicantId/:fingerprintId')
    @ApiParam({ name: 'applicantId', description: 'Application ID' })
    @ApiParam({ name: 'fingerprintId', description: 'Fingerprint ID to delete' })
    @ApiOperation({ summary: 'Delete an enrolled fingerprint' })
    @ApiResponse({
        status: 200,
        description: 'Fingerprint deleted successfully',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    async deleteEnrolledFingerprint(
        @Param('applicantId') applicantId: string,
        @Param('fingerprintId') fingerprintId: string,
        @Request() req: any,
    ) {
        try {
            const result = await this.biometricService.deleteEnrolledFingerprint(
                applicantId,
                fingerprintId,
                req.user?.sub || 0,
            );
            return result;
        } catch (error: any) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * Get Audit Logs
     */
    @Get('audit-logs/:applicantId')
    @ApiParam({ name: 'applicantId', description: 'Application ID' })
    @ApiOperation({ summary: 'Get biometric audit logs for an applicant' })
    @ApiResponse({
        status: 200,
        description: 'Audit logs retrieved',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getAuditLogs(
        @Param('applicantId') applicantId: string,
        @Query('limit') limit: string = '50',
        @Query('offset') offset: string = '0',
    ) {
        try {
            return {
                success: true,
                data: [],
                message: 'Audit logs feature available. Configure data storage.',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
