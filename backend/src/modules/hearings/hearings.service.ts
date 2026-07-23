import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HearingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async scheduleHearing(data: any) {
    const hearing = await this.prisma.hearings.create({
      data: {
        applicationId: data.applicationId,
        scheduledBy: data.scheduledBy,
        hearingType: data.hearingType,
        location: data.location,
        noticeNumber: data.noticeNumber,
        hearingDate: new Date(data.hearingDate),
        remarks: data.remarks,
        status: 'SCHEDULED'
      }
    });

    await this.notifications.sendNotification({
      to: 'Applicant-Phone',
      type: 'SMS',
      subject: 'Hearing Scheduled',
      message: `A hearing has been scheduled for your application on ${hearing.hearingDate.toDateString()} at ${hearing.location}.`
    });

    return hearing;
  }

  async getHearings(applicationId: number) {
    return this.prisma.hearings.findMany({
      where: { applicationId },
      orderBy: { hearingDate: 'asc' },
      include: { scheduler: { select: { id: true, username: true, role: true } } }
    });
  }

  async updateHearing(hearingId: number, data: any) {
    return this.prisma.hearings.update({
      where: { id: hearingId },
      data: {
        decision: data.decision,
        attendanceStatus: data.attendanceStatus,
        remarks: data.remarks,
        status: data.status,
        documents: data.documents || null,
      }
    });
  }
}
