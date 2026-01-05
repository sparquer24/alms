import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import prisma from '../../db/prismaClient';

/**
 * QR Code Service
 * Handles QR code generation logic using the qrcode library
 */
@Injectable()
export class QRCodeService {
    /**
     * Generate QR Code for an application
     * Returns a data URL containing the QR code image
     */
    async generateQRCode(applicationId: number): Promise<[any | null, any | null]> {
        try {
            // First verify the application exists
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                select: {
                    id: true,
                    acknowledgementNo: true,
                    firstName: true,
                    lastName: true,
                },
            });

            if (!application) {
                return ['Application not found', null];
            }

            // Build the public URL for the QR code
            // The frontend public URL will be configured via environment variable
            const frontendBaseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'http://localhost:5000';
            const publicUrl = `${frontendBaseUrl}/public/application/${applicationId}`;

            // Generate QR code as data URL using qrcode library
            const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 400
            });

            return [
                null,
                {
                    applicationId: application.id,
                    acknowledgementNo: application.acknowledgementNo,
                    qrCodeDataUrl,
                    publicUrl,
                },
            ];
        } catch (error: any) {
            console.error('[QRCodeService] Error generating QR code:', error);
            return [error?.message || 'Failed to generate QR code', null];
        }
    }

    /**
     * Check if an application exists
     */
    async checkApplicationExists(applicationId: number): Promise<[any | null, boolean]> {
        try {
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                select: { id: true },
            });

            return [null, !!application];
        } catch (error: any) {
            return [error?.message || 'Failed to check application', false];
        }
    }
}
