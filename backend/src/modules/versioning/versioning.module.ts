// ─── versioning.module.ts ───────────────────────────────────────────────────
// Self-contained NestJS module for all versioning and revert functionality.
// Register this in AppModule.

import { Module } from '@nestjs/common';
import { VersioningController } from './versioning.controller';
import { SnapshotService } from './services/snapshot.service';
import { RevertService } from './services/revert.service';
import { RevertAuditService } from './services/revert-audit.service';

@Module({
  controllers: [VersioningController],
  providers: [SnapshotService, RevertService, RevertAuditService],
  // Export SnapshotService so WorkflowModule can inject it to auto-snapshot before actions
  exports: [SnapshotService],
})
export class VersioningModule {}
