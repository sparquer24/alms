import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HearingsService } from './hearings.service';

describe('HearingsService', () => {
  let service: HearingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HearingsService,
        { provide: PrismaService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = module.get<HearingsService>(HearingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
