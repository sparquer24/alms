import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async submitSHOReport(applicationId: number, officerId: number, data: any) {
    return this.prisma.policeEnquiryReports.create({
      data: {
        applicationId,
        officerId,
        addressVerification: data.addressVerification,
        characterVerification: data.characterVerification,
        occupationVerification: data.occupationVerification,
        criminalVerification: data.criminalVerification,
        threatAssessment: data.threatAssessment,
        storageInspection: data.storageInspection,
        neighbourVerification: data.neighbourVerification,
        remarks: data.remarks,
        recommendation: data.recommendation,
        attachments: data.attachments || null,
      }
    });
  }

  async getReports(applicationId: number) {
    return this.prisma.policeEnquiryReports.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      include: { officer: { select: { id: true, username: true, role: true } } }
    });
  }

  async acpReview(applicationId: number, reviewerId: number, action: string, remarks: string) {
    return this.prisma.freshLicenseApplicationsFormWorkflowHistories.create({
      data: {
        applicationId,
        previousUserId: reviewerId,
        nextUserId: reviewerId, // Mock for this scope
        actionTaken: action,
        remarks: remarks,
      }
    });
  }
}
