import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { isApprovalAction, isRejectionAction, isTerminalAction } from '../../constants/workflow-actions';

export interface NotificationPayload {
  to: string; // phone or email
  type: 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH';
  subject?: string;
  message: string;
  userId?: number;
}

/** Which application table a notification points at. */
export type NotificationApplicationType = 'FRESH' | 'RENEWAL' | 'CANCEL';

export const NOTIFICATION_TYPES = {
  ASSIGNED: 'APPLICATION_ASSIGNED',
  APPROVED: 'APPLICATION_APPROVED',
  REJECTED: 'APPLICATION_REJECTED',
  CLOSED: 'APPLICATION_CLOSED',
} as const;

export interface WorkflowActionEvent {
  applicationType: NotificationApplicationType;
  applicationId: number;
  actionCode: string;
  actorUserId: number;
  nextUserId?: number | null;
  remarks?: string | null;
}

const APPLICATION_TYPE_LABEL: Record<NotificationApplicationType, string> = {
  FRESH: 'Fresh application',
  RENEWAL: 'Renewal application',
  CANCEL: 'Cancellation request',
};

/** Past-tense wording for each workflow action, as it reads in a notification. */
const ACTION_VERB: Record<string, string> = {
  INITIATE: 'submitted',
  FORWARD: 'forwarded',
  RE_ENQUIRY: 'sent for re-enquiry',
  GROUND_REPORT: 'sent for a ground report',
  RECOMMEND: 'recommended',
  NOT_RECOMMEND: 'not recommended',
  RED_FLAG: 'red-flagged',
  APPROVED: 'approved',
  REJECT: 'rejected',
  CLOSE: 'closed',
  DISPOSE: 'disposed',
  CANCEL: 'cancelled',
};

const verbFor = (actionCode: string) =>
  ACTION_VERB[actionCode.toUpperCase()] ?? actionCode.toLowerCase().replace(/_/g, ' ');

const MAX_PAGE_SIZE = 50;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private warnedMissingTable = false;

  /**
   * Until the add_notifications migration is applied the table does not exist (P2021).
   * Serve the fallback and warn once, rather than failing every poll from the bell with a 500.
   */
  private async withTableFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await query();
    } catch (error) {
      if ((error as { code?: string })?.code !== 'P2021') throw error;
      if (!this.warnedMissingTable) {
        this.warnedMissingTable = true;
        this.logger.warn(
          'Notifications table is missing — run `npx prisma migrate deploy` in backend/. Serving empty notifications until then.',
        );
      }
      return fallback;
    }
  }

  /** SMS / email to applicants. Still a mock until a provider is integrated. */
  async sendNotification(payload: NotificationPayload) {
    this.logger.log(`[Mock ${payload.type}] To: ${payload.to} | Subject: ${payload.subject || 'N/A'} | Message: ${payload.message}`);
    // In a production environment, integrate with Twilio/AWS SNS or SendGrid here.
    return { success: true, timestamp: new Date() };
  }

  // ---------------------------------------------------------------------------
  // In-app notifications
  // ---------------------------------------------------------------------------

  async listForUser(userId: number, opts: { page?: number; pageSize?: number; read?: boolean } = {}) {
    const page = Math.max(1, Math.floor(opts.page ?? 1));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(opts.pageSize ?? 20)));
    const where = { userId, ...(opts.read === undefined ? {} : { isRead: opts.read }) };

    const [notifications, total, unreadCount] = await this.withTableFallback(
      () =>
        Promise.all([
          prisma.notifications.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          prisma.notifications.count({ where }),
          prisma.notifications.count({ where: { userId, isRead: false } }),
        ]),
      [[], 0, 0],
    );

    return {
      notifications,
      unreadCount,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  unreadCount(userId: number) {
    return this.withTableFallback(() => prisma.notifications.count({ where: { userId, isRead: false } }), 0);
  }

  async markAsRead(userId: number, notificationId: number) {
    // Scoped to the caller so one user can never mark another user's notification.
    const { count } = await this.withTableFallback(
      () =>
        prisma.notifications.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true, readAt: new Date() },
        }),
      { count: 0 },
    );
    if (count === 0) throw new NotFoundException('Notification not found.');
  }

  async markAllAsRead(userId: number) {
    const { count } = await this.withTableFallback(
      () =>
        prisma.notifications.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        }),
      { count: 0 },
    );
    return count;
  }

  /**
   * Notifies the people affected by a workflow action:
   * - the officer the application now sits with (if it moved to someone else);
   * - on approval / rejection / closure, also whoever submitted it.
   * Never throws: a notification failure must not undo or fail the action itself.
   */
  async notifyWorkflowAction(event: WorkflowActionEvent): Promise<void> {
    try {
      const actionCode = event.actionCode.toUpperCase();
      const [actor, application] = await Promise.all([
        prisma.users.findUnique({
          where: { id: event.actorUserId },
          select: { username: true, role: { select: { code: true } } },
        }),
        this.describeApplication(event.applicationType, event.applicationId),
      ]);

      const typeLabel = APPLICATION_TYPE_LABEL[event.applicationType];
      const ref = application.reference;
      const actorLabel = actor ? `${actor.username}${actor.role?.code ? ` (${actor.role.code})` : ''}` : 'An officer';
      const applicant = application.applicantName ? ` for ${application.applicantName}` : '';
      const remarks = event.remarks?.trim() ? ` Remarks: "${event.remarks.trim()}"` : '';
      const verb = verbFor(actionCode);

      const rows: Array<{ userId: number; type: string; title: string; message: string }> = [];
      const recipients = new Set<number>();
      const add = (userId: number | null | undefined, type: string, title: string, message: string) => {
        if (!userId || userId === event.actorUserId || recipients.has(userId)) return;
        recipients.add(userId);
        rows.push({ userId, type, title, message });
      };

      if (isTerminalAction(actionCode)) {
        const type = isApprovalAction(actionCode)
          ? NOTIFICATION_TYPES.APPROVED
          : isRejectionAction(actionCode)
            ? NOTIFICATION_TYPES.REJECTED
            : NOTIFICATION_TYPES.CLOSED;
        const title = `${typeLabel} ${ref} ${verb}`;
        const message = `${typeLabel} ${ref}${applicant} was ${verb} by ${actorLabel}.${remarks}`;
        add(application.submittedByUserId, type, title, message);
        add(event.nextUserId, type, title, message);
      } else {
        add(
          event.nextUserId,
          NOTIFICATION_TYPES.ASSIGNED,
          `${typeLabel} ${ref} ${verb} to you`,
          `${actorLabel} ${verb} ${typeLabel.toLowerCase()} ${ref}${applicant} to you.${remarks}`,
        );
      }

      if (rows.length === 0) return;
      await prisma.notifications.createMany({
        data: rows.map(row => ({
          ...row,
          applicationId: event.applicationId,
          applicationType: event.applicationType,
        })),
      });
    } catch (error) {
      this.logger.warn(
        `Could not create notifications for ${event.applicationType} #${event.applicationId} (${event.actionCode}): ${(error as Error)?.message}`,
      );
    }
  }

  /** Reference shown in the notification, the applicant's name, and who submitted it. */
  private async describeApplication(applicationType: NotificationApplicationType, applicationId: number) {
    const fallbackRef = `#${applicationId}`;
    const fullName = (a?: { firstName?: string | null; lastName?: string | null } | null) =>
      [a?.firstName, a?.lastName].filter(Boolean).join(' ') || null;

    if (applicationType === 'CANCEL') {
      const request = await prisma.cancelFormRequests.findUnique({
        where: { id: applicationId },
        select: { acknowledgementNo: true, requestedBy: true },
      });
      return { reference: request?.acknowledgementNo || fallbackRef, applicantName: null, submittedByUserId: request?.requestedBy ?? null };
    }

    // Fresh and renewal records don't store who created them; the first workflow
    // step is taken by the submitting officer, so that is who gets the outcome.
    if (applicationType === 'RENEWAL') {
      const [app, first] = await Promise.all([
        prisma.renewalFormPersonalDetails.findUnique({
          where: { id: applicationId },
          select: { acknowledgementNo: true, firstName: true, lastName: true },
        }),
        prisma.renewalApplicationsFormWorkflowHistories.findFirst({
          where: { applicationId },
          orderBy: { createdAt: 'asc' },
          select: { previousUserId: true },
        }),
      ]);
      return { reference: app?.acknowledgementNo || fallbackRef, applicantName: fullName(app), submittedByUserId: first?.previousUserId ?? null };
    }

    const [app, first] = await Promise.all([
      prisma.freshLicenseApplicationPersonalDetails.findUnique({
        where: { id: applicationId },
        select: { acknowledgementNo: true, firstName: true, lastName: true },
      }),
      prisma.freshLicenseApplicationsFormWorkflowHistories.findFirst({
        where: { applicationId },
        orderBy: { createdAt: 'asc' },
        select: { previousUserId: true },
      }),
    ]);
    return { reference: app?.acknowledgementNo || fallbackRef, applicantName: fullName(app), submittedByUserId: first?.previousUserId ?? null };
  }
}
