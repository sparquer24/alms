import { Controller, Get, Param, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { Roles } from '../../decorators/roles.decorator';
import { QRCodeService } from './qrcode.service';
import { ROLE_CODES } from '../../constants/workflow-actions';

/**
 * QR Code Controller
 * Handles QR code generation for applications
 * Restricted to ZS role users only
 */
@ApiTags('QR Code')
@Controller('qrcode')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class QRCodeController {
    constructor(private readonly qrcodeService: QRCodeService) { }

    @Get('generate/:applicationId')
    @Roles(ROLE_CODES.ZS)
    @ApiOperation({
        summary: 'Generate QR Code for Application',
        description: 'Generate a QR code containing a public URL for the application. Only ZS role users can generate QR codes.',
    })
    @ApiParam({
        name: 'applicationId',
        description: 'Application ID to generate QR code for',
        example: '123',
    })
    @ApiResponse({
        status: 200,
        description: 'QR code generated successfully',
        schema: {
            example: {
                success: true,
                data: {
                    applicationId: 123,
                    qrCodeDataUrl: 'data:image/png;base64,...',
                    publicUrl: 'https://example.com/public/application/123',
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only ZS role can generate QR codes' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async generateQRCode(
        @Param('applicationId') applicationId: string,
        @Request() req: any
    ) {
        try {
            // Verify user has ZS role
            const userRoleCode = req.user?.roleCode;
            if (userRoleCode !== ROLE_CODES.ZS) {
                throw new HttpException(
                    { success: false, error: 'Only ZS role users can generate QR codes' },
                    HttpStatus.FORBIDDEN
                );
            }

            const applicationIdNum = parseInt(applicationId, 10);
            if (isNaN(applicationIdNum)) {
                throw new HttpException(
                    { success: false, error: 'Invalid application ID format' },
                    HttpStatus.BAD_REQUEST
                );
            }

            const [error, result] = await this.qrcodeService.generateQRCode(applicationIdNum);

            if (error) {
                const errorMessage = typeof error === 'object' && (error as any).message ? (error as any).message : error;
                throw new HttpException(
                    { success: false, error: errorMessage },
                    HttpStatus.BAD_REQUEST
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
                { success: false, error: err?.message || 'Failed to generate QR code' },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('check/:applicationId')
    @ApiOperation({
        summary: 'Check if QR Code can be generated',
        description: 'Check if the current user can generate a QR code for the specified application',
    })
    @ApiParam({
        name: 'applicationId',
        description: 'Application ID to check',
        example: '123',
    })
    @ApiResponse({
        status: 200,
        description: 'Check completed',
        schema: {
            example: {
                success: true,
                data: {
                    canGenerate: true,
                    applicationId: 123,
                    applicationExists: true,
                    userHasPermission: true,
                },
            },
        },
    })
    async checkQRCodePermission(
        @Param('applicationId') applicationId: string,
        @Request() req: any
    ) {
        try {
            const applicationIdNum = parseInt(applicationId, 10);
            if (isNaN(applicationIdNum)) {
                return {
                    success: true,
                    data: {
                        canGenerate: false,
                        applicationId: applicationId,
                        applicationExists: false,
                        userHasPermission: false,
                        reason: 'Invalid application ID format',
                    },
                };
            }

            const userRoleCode = req.user?.roleCode;
            const userHasPermission = userRoleCode === ROLE_CODES.ZS;

            const [error, applicationExists] = await this.qrcodeService.checkApplicationExists(applicationIdNum);

            return {
                success: true,
                data: {
                    canGenerate: userHasPermission && applicationExists,
                    applicationId: applicationIdNum,
                    applicationExists: !!applicationExists,
                    userHasPermission,
                    reason: !userHasPermission
                        ? 'Only ZS role can generate QR codes'
                        : !applicationExists
                            ? 'Application not found'
                            : null,
                },
            };
        } catch (err: any) {
            throw new HttpException(
                { success: false, error: err?.message || 'Failed to check QR code permission' },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
