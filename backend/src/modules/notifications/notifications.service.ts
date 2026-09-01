import { Injectable, Logger } from '@nestjs/common';

export interface NotificationPayload {
  to: string; // phone or email
  type: 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH';
  subject?: string;
  message: string;
  userId?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendNotification(payload: NotificationPayload) {
    this.logger.log(`[Mock ${payload.type}] To: ${payload.to} | Subject: ${payload.subject || 'N/A'} | Message: ${payload.message}`);
    // In a production environment, integrate with Twilio/AWS SNS or SendGrid here.
    return { success: true, timestamp: new Date() };
  }
}
