// ─── versioning.controller.ts ───────────────────────────────────────────────
// All HTTP routes for version history, revert, compare, and audit logs.
// Protected by AuthGuard (full JWT + DB user lookup, same as ApplicationFormModule).

import {
  Controller, Get, Post, Param, Query, Body, Req, UseGuards,
  ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../middleware/auth.middleware';
import { SnapshotService } from './services/snapshot.service';
import { RevertService } from './services/revert.service';
import { RevertAuditService } from './services/revert-audit.service';
import { RevertRequestDto } from './dto/revert-request.dto';
import { VersionQueryDto } from './dto/version-query.dto';
import { CompareVersionsDto } from './dto/compare-versions.dto';
import { ApplicationType } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('versions')
export class VersioningController {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly revertService: RevertService,
    private readonly revertAuditService: RevertAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/versions/:applicationId
  // Returns full version timeline for an application (latest first)
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':applicationId')
  async getVersionHistory(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Query() query: VersionQueryDto,
  ) {
    const versions = await this.snapshotService.getVersionHistory(
      applicationId,
      query.applicationType,
    );
    return {
      success: true,
      data: { versions, totalCount: versions.length },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/versions/:applicationId/:versionNumber
  // Returns full snapshot data for a specific version
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':applicationId/:versionNumber')
  async getVersionSnapshot(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @Query('applicationType') applicationType: ApplicationType,
  ) {
    const snapshot = await this.snapshotService.getVersion(
      applicationId,
      applicationType,
      versionNumber,
    );
    return { success: true, data: snapshot };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/versions/:applicationId/compare
  // Compare two versions field-by-field
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':applicationId/compare/diff')
  async compareVersions(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Query() query: CompareVersionsDto,
  ) {
    const diff = await this.revertService.compareVersions(
      applicationId,
      query.applicationType,
      query.fromVersion,
      query.toVersion,
    );
    return { success: true, data: diff };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/versions/:applicationId/revert/validate
  // Pre-validate a revert before showing the confirmation modal
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':applicationId/revert/validate')
  async validateRevert(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Query('applicationType') applicationType: ApplicationType,
    @Query('targetVersionNumber', ParseIntPipe) targetVersionNumber: number,
    @Req() req: any,
  ) {
    const result = await this.revertService.validateRevert({
      applicationId,
      applicationType,
      targetVersionNumber,
      requestingUserId: req.user.sub || req.user.user_id,
      requestingRoleId: req.user.roleId,
    });
    return { success: true, data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/versions/:applicationId/revert
  // Execute a revert — creates new version, updates application, writes audit log
  // ─────────────────────────────────────────────────────────────────────────
  @Post(':applicationId/revert')
  @HttpCode(HttpStatus.OK)
  async executeRevert(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() dto: RevertRequestDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const result = await this.revertService.executeRevert({
      applicationId,
      applicationType: dto.applicationType,
      targetVersionNumber: dto.targetVersionNumber,
      reason: dto.reason,
      escalationDocumentUrl: dto.escalationDocumentUrl,
      requestingUserId: req.user.sub || req.user.user_id,
      requestingRoleId: req.user.roleId,
      expectedCurrentVersion: dto.expectedCurrentVersion,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    });

    return { success: true, data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/versions/audit/logs — Admin: list all revert audit logs
  // GET /api/versions/audit/logs/:applicationId — Audit logs for one application
  // ─────────────────────────────────────────────────────────────────────────
  @Get('audit/logs')
  async listAuditLogs(
    @Query('applicationType') applicationType?: ApplicationType,
    @Query('revertedByUserId') revertedByUserId?: string,
    @Query('isTerminalRevert') isTerminalRevert?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.revertAuditService.listAuditLogs({
      applicationType,
      revertedByUserId: revertedByUserId ? parseInt(revertedByUserId) : undefined,
      isTerminalRevert: isTerminalRevert !== undefined ? isTerminalRevert === 'true' : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    return { success: true, data: result };
  }

  @Get('audit/logs/:applicationId')
  async getApplicationAuditLogs(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Query('applicationType') applicationType: ApplicationType,
  ) {
    const logs = await this.revertAuditService.getApplicationRevertLogs(
      applicationId,
      applicationType,
    );
    return { success: true, data: logs };
  }
}
