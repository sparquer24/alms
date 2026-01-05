import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';

/**
 * Public Service - Handles public-facing data retrieval
 * Returns only non-sensitive information suitable for public viewing
 */
@Injectable()
export class PublicService {
    /**
     * Get public application details (read-only)
     * Returns sanitized application data suitable for public viewing via QR code scan
     */
    async getPublicApplicationDetails(
        applicationId: number
    ): Promise<[any | null, any | null]> {
        try {
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                include: {
                    workflowStatus: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    permanentAddress: {
                        include: {
                            state: { select: { id: true, name: true } },
                            district: { select: { id: true, name: true } },
                            policeStation: { select: { id: true, name: true } },
                        },
                    },
                    presentAddress: {
                        include: {
                            state: { select: { id: true, name: true } },
                            district: { select: { id: true, name: true } },
                            policeStation: { select: { id: true, name: true } },
                        },
                    },
                    licenseDetails: {
                        include: {
                            requestedWeapons: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                },
                            },
                        },
                    },
                    fileUploads: {
                        where: {
                            fileType: 'PHOTOGRAPH',
                        },
                        orderBy: {
                            uploadedAt: 'desc',
                        },
                        take: 1,
                    },
                },
            });

            if (!application) {
                return ['Application not found', null];
            }

            // Get photo URL from fileUploads
            const photoUpload = application.fileUploads?.[0];
            const photoUrl = photoUpload?.fileUrl || null;

            // Build sanitized public response
            // Only include non-sensitive information
            const publicData = {
                applicationId: application.id,
                acknowledgementNo: application.acknowledgementNo,
                almsLicenseId: application.almsLicenseId,

                // Applicant Basic Info (limited)
                applicantName: `${application.firstName} ${application.middleName || ''} ${application.lastName}`.trim(),
                sex: application.sex,
                dateOfBirth: application.dateOfBirth,

                // Photo URL
                photoUrl: photoUrl,

                // Application Status
                applicationStatus: application.workflowStatus?.name || 'Unknown',
                statusCode: application.workflowStatus?.code || null,
                isApproved: application.isApproved,
                isRejected: application.isRejected,
                isPending: application.isPending,
                isRecommended: application.isRecommended,
                isNotRecommended: application.isNotRecommended,

                // License Details (public info only)
                licenseDetails: application.licenseDetails?.map((ld) => ({
                    needForLicense: ld.needForLicense,
                    armsCategory: ld.armsCategory,
                    areaOfValidity: ld.areaOfValidity,
                    requestedWeapons: ld.requestedWeapons?.map((w) => ({
                        name: w.name,
                        description: w.description,
                    })),
                })),

                // Address Info (district/state only for verification)
                permanentAddress: application.permanentAddress
                    ? {
                        state: application.permanentAddress.state?.name,
                        district: application.permanentAddress.district?.name,
                        policeStation: application.permanentAddress.policeStation?.name,
                    }
                    : null,
                presentAddress: application.presentAddress
                    ? {
                        state: application.presentAddress.state?.name,
                        district: application.presentAddress.district?.name,
                        policeStation: application.presentAddress.policeStation?.name,
                    }
                    : null,

                // Timestamps
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            };

            return [null, publicData];
        } catch (error: any) {
            console.error('[PublicService] Error fetching public application details:', error);
            return [error?.message || 'Failed to fetch application details', null];
        }
    }
}
