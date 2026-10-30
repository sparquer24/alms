jest.mock('../../db/prismaClient', () => ({
  __esModule: true,
  default: {
    users: { findUnique: jest.fn() },
    freshLicenseApplicationPersonalDetails: { findUnique: jest.fn() },
    freshLicenseApplicationsFormWorkflowHistories: { findFirst: jest.fn() },
    renewalFormPersonalDetails: { findUnique: jest.fn() },
    renewalApplicationsFormWorkflowHistories: { findFirst: jest.fn() },
    cancelFormRequests: { findUnique: jest.fn() },
    notifications: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { NotFoundException } from '@nestjs/common';
import prisma from '../../db/prismaClient';
import { NotificationsService, NOTIFICATION_TYPES } from './notifications.service';

const mockPrisma = prisma as any;

const ZS = 10; // submitted the application
const SHO = 20;
const ACP = 30;

const createdRows = () => mockPrisma.notifications.createMany.mock.calls[0]?.[0]?.data ?? [];

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService();
    mockPrisma.users.findUnique.mockResolvedValue({ username: 'sho_banjara', role: { code: 'SHO' } });
    mockPrisma.freshLicenseApplicationPersonalDetails.findUnique.mockResolvedValue({
      acknowledgementNo: 'ALMS-1001',
      firstName: 'Ravi',
      lastName: 'Kumar',
    });
    mockPrisma.freshLicenseApplicationsFormWorkflowHistories.findFirst.mockResolvedValue({ previousUserId: ZS });
    mockPrisma.notifications.createMany.mockResolvedValue({ count: 1 });
  });

  describe('notifyWorkflowAction', () => {
    it('notifies only the officer an application is forwarded to', async () => {
      await service.notifyWorkflowAction({
        applicationType: 'FRESH',
        applicationId: 1,
        actionCode: 'FORWARD',
        actorUserId: SHO,
        nextUserId: ACP,
        remarks: 'Verified',
      });

      const rows = createdRows();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        userId: ACP,
        type: NOTIFICATION_TYPES.ASSIGNED,
        title: 'Fresh application ALMS-1001 forwarded to you',
        applicationId: 1,
        applicationType: 'FRESH',
      });
      expect(rows[0].message).toContain('sho_banjara (SHO) forwarded');
      expect(rows[0].message).toContain('Ravi Kumar');
      expect(rows[0].message).toContain('Remarks: "Verified"');
    });

    it('does not notify the actor about their own action', async () => {
      await service.notifyWorkflowAction({
        applicationType: 'FRESH',
        applicationId: 1,
        actionCode: 'RE_ENQUIRY',
        actorUserId: SHO,
        nextUserId: SHO,
      });

      expect(mockPrisma.notifications.createMany).not.toHaveBeenCalled();
    });

    it('tells the submitter and the next holder once each when an application is approved', async () => {
      await service.notifyWorkflowAction({
        applicationType: 'FRESH',
        applicationId: 1,
        actionCode: 'APPROVED',
        actorUserId: ACP,
        nextUserId: ZS,
      });

      const rows = createdRows();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ userId: ZS, type: NOTIFICATION_TYPES.APPROVED });
      expect(rows[0].title).toBe('Fresh application ALMS-1001 approved');
    });

    it('notifies the requester of a rejected cancellation request', async () => {
      mockPrisma.cancelFormRequests.findUnique.mockResolvedValue({ acknowledgementNo: null, requestedBy: ZS });

      await service.notifyWorkflowAction({
        applicationType: 'CANCEL',
        applicationId: 7,
        actionCode: 'REJECT',
        actorUserId: ACP,
        nextUserId: SHO,
      });

      const rows = createdRows();
      expect(rows.map((r: any) => r.userId).sort()).toEqual([ZS, SHO].sort());
      expect(rows[0]).toMatchObject({ type: NOTIFICATION_TYPES.REJECTED, applicationType: 'CANCEL' });
      expect(rows[0].title).toBe('Cancellation request #7 rejected');
    });

    it('never throws when saving fails, so the workflow action is unaffected', async () => {
      mockPrisma.notifications.createMany.mockRejectedValue(new Error('db down'));

      await expect(
        service.notifyWorkflowAction({
          applicationType: 'FRESH',
          applicationId: 1,
          actionCode: 'FORWARD',
          actorUserId: SHO,
          nextUserId: ACP,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('read state', () => {
    it("only marks the caller's own notification", async () => {
      mockPrisma.notifications.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markAsRead(SHO, 99)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockPrisma.notifications.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99, userId: SHO } }),
      );
    });

    it('caps the page size', async () => {
      mockPrisma.notifications.findMany.mockResolvedValue([]);
      mockPrisma.notifications.count.mockResolvedValue(0);

      const result = await service.listForUser(SHO, { pageSize: 500 });

      expect(result.pagination.pageSize).toBe(50);
      expect(mockPrisma.notifications.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
    });
  });
});
