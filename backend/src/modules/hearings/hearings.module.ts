import { Module } from '@nestjs/common';
import { HearingsService } from './hearings.service';
import { HearingsController } from './hearings.controller';
import { PrismaService } from '../../services/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [HearingsController],
  providers: [HearingsService, PrismaService],
})
export class HearingsModule {}
