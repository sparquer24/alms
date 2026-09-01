import { Controller, Get, Param, HttpException, HttpStatus, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';
import { PublicService } from './public.service';

/**
 * Public Controller - No authentication required
 * Handles public-facing endpoints like QR code scanned application details
 */
@ApiTags('Public')
@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('dashboard/overview')
    @ApiOperation({
        summary: 'Get Universal Public Dashboard Overview',
        description: 'Retrieve aggregated, anonymized statistics, volume trends, status distributions, weapon categories, zonal loads, and recent public activity for the universal dashboard. No authentication required.',
    })
    @ApiResponse({
        status: 200,
        description: 'Public dashboard statistics retrieved successfully',
    })
    async getPublicDashboardOverview(
        @Query('timeRange') timeRange?: string,
        @Query('type') type?: string,
        @Req() req?: any,
    ) {
        try {
            let stateId: number | undefined;
            let roleCode: string | undefined;

            const authHeader = req?.headers?.authorization;
            if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
                const token = authHeader.replace('Bearer ', '').trim();
                const secret = process.env.JWT_SECRET;
                if (secret && token) {
                    try {
                        const decoded = jwt.verify(token, secret) as any;
                        const parsedStateId = decoded?.state_id ?? decoded?.stateId;
                        stateId = parsedStateId ? Number(parsedStateId) : undefined;
                        roleCode = decoded?.role_code || (typeof decoded?.role === 'string' ? decoded.role : decoded?.role?.code);
                    } catch (e) {
                        // ignore token verification error, fallback to public view
                    }
                }
            }

            const data = await this.publicService.getPublicDashboardOverview(timeRange, type, stateId, roleCode);
            return data;
        } catch (err: any) {
            throw new HttpException(
                { success: false, error: err?.message || 'Failed to fetch public dashboard data' },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

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
    async getPublicApplicationDetails(
        @Param('applicationId') applicationId: string,
        @Query('type') type?: string
    ) {
        try {
            const applicationIdNum = parseInt(applicationId, 10);
            if (isNaN(applicationIdNum)) {
                throw new HttpException(
                    { success: false, error: 'Invalid application ID format' },
                    HttpStatus.BAD_REQUEST
                );
            }

            const [error, result] = await this.publicService.getPublicApplicationDetails(applicationIdNum, type);

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
