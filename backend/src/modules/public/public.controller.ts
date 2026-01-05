import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PublicService } from './public.service';

/**
 * Public Controller - No authentication required
 * Handles public-facing endpoints like QR code scanned application details
 */
@ApiTags('Public')
@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('application/:applicationId')
    @ApiOperation({
        summary: 'Get Public Application Details',
        description: 'Retrieve read-only application details for public viewing (via QR code scan). No authentication required.',
    })
    @ApiParam({
        name: 'applicationId',
        description: 'Application ID from QR code',
        example: '123',
    })
    @ApiResponse({
        status: 200,
        description: 'Application details retrieved successfully',
        schema: {
            example: {
                success: true,
                data: {
                    applicationId: 123,
                    acknowledgementNo: 'ALMS-2024-001234',
                    applicantName: 'John Doe',
                    sex: 'MALE',
                    dateOfBirth: '1990-01-15',
                    applicationStatus: 'APPROVED',
                    licenseDetails: {
                        needForLicense: 'SELF_PROTECTION',
                        armsCategory: 'PERMISSIBLE',
                        areaOfValidity: 'District-wide',
                    },
                    isApproved: true,
                    almsLicenseId: 'LIC-2024-001234',
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async getPublicApplicationDetails(@Param('applicationId') applicationId: string) {
        try {
            const applicationIdNum = parseInt(applicationId, 10);
            if (isNaN(applicationIdNum)) {
                throw new HttpException(
                    { success: false, error: 'Invalid application ID format' },
                    HttpStatus.BAD_REQUEST
                );
            }

            const [error, result] = await this.publicService.getPublicApplicationDetails(applicationIdNum);

            if (error) {
                const errorMessage = typeof error === 'object' && (error as any).message ? (error as any).message : error;
                throw new HttpException(
                    { success: false, error: errorMessage },
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                success: true,
                data: result,
            };
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }

            throw new HttpException(
                { success: false, error: err?.message || 'Failed to fetch application details' },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
