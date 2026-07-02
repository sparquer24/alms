import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiryReminders() {
    this.logger.debug('Running daily expiry reminder check...');
    
    // Date exactly 30 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const expiringLicenses = await this.prisma.licenses.findMany({
      where: {
        validTill: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'ACTIVE'
      }
    });

    for (const license of expiringLicenses) {
      await this.notifications.sendNotification({
        to: 'Applicant-Phone', // In real scenario, join with user/application contact info
        type: 'SMS',
        subject: 'License Expiry Warning',
        message: `Your Arms License ${license.licenseNumber} will expire on ${license.validTill.toDateString()}. Please submit a renewal application.`
      });
    }

    this.logger.debug(`Sent ${expiringLicenses.length} expiry reminders.`);
  }
}
