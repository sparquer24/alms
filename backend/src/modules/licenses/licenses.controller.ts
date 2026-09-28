import { Controller, Get, Post, Param, Query, Body, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';
import { LicensesService } from './licenses.service';
import { CommitLicenseImportDto, PreviewLicenseImportDto } from './dto/import-licenses.dto';
import { AuthGuard } from '../../middleware/auth.middleware';
import { Roles } from '../../decorators/roles.decorator';

/** Roles allowed to import, mirroring LICENSE_ROLES on the License Management page. */
const LICENSE_IMPORT_ROLES = ['ADMIN', 'SUPER_ADMIN', 'ZS', 'DCP', 'CP', 'JTCP', 'ARMS_SUPDT', 'ARMS_SEAT', 'ACO'];

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  private extractUserFromReq(req: any): { stateId?: number; districtId?: number; zoneId?: number; roleCode?: string } {
    if (req?.user) {
      const stateId = req.user.stateId ? Number(req.user.stateId) : undefined;
      const districtId = req.user.districtId ? Number(req.user.districtId) : undefined;
      const zoneId = req.user.zoneId ? Number(req.user.zoneId) : undefined;
      const roleCode = req.user.roleCode || (typeof req.user.role === 'string' ? req.user.role : req.user.role?.code);
      return { stateId, districtId, zoneId, roleCode };
    }
    const authHeader = req?.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const secret = process.env.JWT_SECRET;
      if (secret && token) {
        try {
          const decoded = jwt.verify(token, secret) as any;
          const parsedStateId = decoded?.state_id ?? decoded?.stateId;
          const stateId = parsedStateId ? Number(parsedStateId) : undefined;
          const parsedDistrictId = decoded?.district_id ?? decoded?.districtId;
          const districtId = parsedDistrictId ? Number(parsedDistrictId) : undefined;
          const parsedZoneId = decoded?.zone_id ?? decoded?.zoneId;
          const zoneId = parsedZoneId ? Number(parsedZoneId) : undefined;
          const roleCode = decoded?.role_code || (typeof decoded?.role === 'string' ? decoded.role : decoded?.role?.code);
          return { stateId, districtId, zoneId, roleCode };
        } catch (e) {
          // ignore
        }
      }
    }
    return {};
  }

  /**
   * Identity + jurisdiction for bulk import. The AuthGuard already resolved the
   * user from the database, so imported rows are scoped to the state the login
   * actually belongs to (and every imported license is attributed to that user).
   */
  private extractImportScope(req: any): { userId?: number; stateId?: number; roleCode?: string } {
    const { stateId, roleCode } = this.extractUserFromReq(req);
    const user = req?.user ?? {};
    const rawUserId = user.user_id ?? user.userId ?? user.sub ?? user.id;
    const parsedUserId = rawUserId !== undefined && rawUserId !== null ? Number(rawUserId) : undefined;
    return {
      userId: parsedUserId !== undefined && Number.isFinite(parsedUserId) ? parsedUserId : undefined,
      stateId,
      roleCode,
    };
  }

  @Post('generate/:freshApplicationId')
  @ApiOperation({ summary: 'Generate a license PDF from a fresh application' })
  async generateLicense(
    @Param('freshApplicationId') freshApplicationId: string,
    @Body('issuedBy') issuedBy: string | number
  ) {
    return this.licensesService.generateLicensePdf(Number(freshApplicationId), Number(issuedBy));
  }

  // ---------------------------------------------------------------------------
  // Bulk import. Static POST paths are declared before any parameterized route
  // so /licenses/import never resolves as an :id lookup.
  // ---------------------------------------------------------------------------

  @Post('import/preview')
  @UseGuards(AuthGuard)
  @Roles(...LICENSE_IMPORT_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate a bulk license import without saving anything',
    description:
      'Accepts parsed CSV/XLSX rows and returns a per-row report: required-field, enum, date, address-hierarchy and duplicate problems, plus what would actually be written. Nothing is persisted.',
  })
  async previewLicenseImport(@Body() body: PreviewLicenseImportDto, @Req() req: any) {
    return this.licensesService.previewLicenseImport(body.rows, this.extractImportScope(req), {
      strict: body.strict,
    });
  }

  @Post('import')
  @UseGuards(AuthGuard)
  @Roles(...LICENSE_IMPORT_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Import licenses in bulk',
    description:
      'Re-validates the rows server-side and creates the importable ones, reporting partial success per row. Every created license is tagged with a batch id so the whole batch can be rolled back.',
  })
  async importLicenses(@Body() body: CommitLicenseImportDto, @Req() req: any) {
    return this.licensesService.commitLicenseImport(body.rows, this.extractImportScope(req), {
      strict: body.strict,
      onDuplicate: body.onDuplicate,
      fileName: body.fileName,
    });
  }

  @Post('import/rollback/:batchId')
  @UseGuards(AuthGuard)
  @Roles(...LICENSE_IMPORT_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Roll back a bulk license import batch',
    description:
      'Deletes the licenses created by a single import batch. Licenses that have since been renewed, cancelled or referenced elsewhere are kept and reported back.',
  })
  async rollbackLicenseImport(@Param('batchId') batchId: string, @Req() req: any) {
    return this.licensesService.rollbackLicenseImportBatch(batchId, this.extractImportScope(req));
  }

  // IMPORTANT: Static-path GET routes must come BEFORE parameterized :id routes
  // to avoid Express route collision (/licenses/by-number/X matching :id as 'by-number')

  @Get()
  @ApiOperation({ summary: 'List/search licenses with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search across name, license number, aadhar' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'REVOKED'] })
  @ApiQuery({ name: 'licenseNumber', required: false, description: 'Filter by license number (partial match)' })
  @ApiQuery({ name: 'aadharNumber', required: false, description: 'Filter by aadhar number' })
  @ApiQuery({ name: 'freshApplicationId', required: false, type: Number, description: 'Filter by fresh application ID' })
  @ApiQuery({ name: 'expiringWithinDays', required: false, type: Number, description: 'Filter active licenses expiring within N days' })
  @ApiQuery({ name: 'createdFrom', required: false, description: 'Filter by source marker, e.g. Fresh or Imported' })
  @ApiQuery({ name: 'purpose', required: false, enum: ['SELF_PROTECTION', 'SPORTS', 'HEIRLOOM_POLICY', 'CROP_PROTECTION'], description: 'Filter by license purpose' })
  @ApiQuery({ name: 'renewedOnly', required: false, type: Boolean, description: 'Only licenses with at least one renewal' })
  @ApiQuery({ name: 'orderBy', required: false, example: 'createdAt', enum: ['id', 'licenseNumber', 'firstName', 'lastName', 'createdAt', 'validTill', 'status'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], example: 'desc' })
  async getAllLicenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('licenseNumber') licenseNumber?: string,
    @Query('aadharNumber') aadharNumber?: string,
    @Query('freshApplicationId') freshApplicationId?: string,
    @Query('expiringWithinDays') expiringWithinDays?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('purpose') purpose?: string,
    @Query('renewedOnly') renewedOnly?: string,
    @Query('orderBy') orderBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Req() req?: any,
  ) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getAllLicenses({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status,
      licenseNumber,
      aadharNumber,
      freshApplicationId: freshApplicationId ? Number(freshApplicationId) : undefined,
      expiringWithinDays: expiringWithinDays ? Number(expiringWithinDays) : undefined,
      createdFrom,
      purpose,
      renewedOnly: renewedOnly === 'true',
      orderBy,
      order,
      stateId,
      districtId,
      zoneId,
      roleCode,
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get license dashboard counts and expiry buckets' })
  async getLicenseDashboard(@Req() req?: any) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getLicenseStatistics(stateId, roleCode, districtId, zoneId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get active licenses expiring within a selected window' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 90 })
  async getExpiringLicenses(
    @Query('days') days?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('purpose') purpose?: string,
    @Query('renewedOnly') renewedOnly?: string,
    @Req() req?: any,
  ) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getAllLicenses({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status: 'ACTIVE',
      expiringWithinDays: days ? Number(days) : 90,
      purpose,
      renewedOnly: renewedOnly === 'true',
      orderBy: 'validTill',
      order: 'asc',
      stateId,
      districtId,
      zoneId,
      roleCode,
    });
  }

  @Get('expired')
  @ApiOperation({ summary: 'Get expired licenses' })
  async getExpiredLicenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('purpose') purpose?: string,
    @Query('renewedOnly') renewedOnly?: string,
    @Req() req?: any,
  ) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getAllLicenses({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status: 'EXPIRED',
      purpose,
      renewedOnly: renewedOnly === 'true',
      orderBy: 'validTill',
      order: 'desc',
      stateId,
      districtId,
      zoneId,
      roleCode,
    });
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get license statistics (counts by status)' })
  async getLicenseStatistics(@Req() req?: any) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getLicenseStatistics(stateId, roleCode, districtId, zoneId);
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'List license workflow audit/activity logs across all licenses, with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by license number, holder name, officer, action, remarks' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by exact action, e.g. ISSUED, RENEWED, CANCELLED' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'ISO date, inclusive start' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'ISO date, inclusive end' })
  async getLicenseAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: any,
  ) {
    const { stateId, districtId, zoneId, roleCode } = this.extractUserFromReq(req);
    return this.licensesService.getLicenseAuditLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      action,
      dateFrom,
      dateTo,
      stateId,
      districtId,
      zoneId,
      roleCode,
    });
  }

  @Get('by-number/:licenseNumber')
  @ApiOperation({ summary: 'Lookup a license by its license number' })
  @ApiParam({ name: 'licenseNumber', description: 'License number (e.g., LUAN2026-...)', example: 'LUAN20260702143045123456' })
  async getLicenseByNumber(@Param('licenseNumber') licenseNumber: string) {
    const license = await this.licensesService.getLicenseByNumber(licenseNumber);
    if (!license) throw new NotFoundException('License not found');
    return license;
  }

  @Get('by-aadhar/:aadharNumber')
  @ApiOperation({ summary: 'Lookup licenses by aadhar number' })
  @ApiParam({ name: 'aadharNumber', description: '12-digit aadhar number', example: '123456789012' })
  async getLicenseByAadhar(@Param('aadharNumber') aadharNumber: string) {
    const licenses = await this.licensesService.getLicenseByAadhar(aadharNumber);
    if (licenses.length === 0) throw new NotFoundException('No licenses found for this aadhar number');
    return licenses;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a license by ID or license number with full details' })
  @ApiParam({ name: 'id', description: 'License ID (numeric) or License Number (LUAN-prefixed)' })
  async getLicenseById(@Param('id') id: string) {
    const license = await this.licensesService.getLicenseById(id);
    if (!license) throw new NotFoundException('License not found');
    return {
      success: true,
      message: 'Applications retrieved successfully',
      data: license,
    };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get workflow history for a license' })
  @ApiParam({ name: 'id', description: 'License ID' })
  async getLicenseHistory(@Param('id') id: string) {
    const license = await this.licensesService.getLicenseById(id);
    if (!license) throw new NotFoundException('License not found');
    return this.licensesService.getLicenseHistory(Number(id));
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit events for a license' })
  @ApiParam({ name: 'id', description: 'License ID' })
  async getLicenseAudit(@Param('id') id: string) {
    const license = await this.licensesService.getLicenseById(id);
    if (!license) throw new NotFoundException('License not found');
    return this.licensesService.getLicenseAudit(Number(id));
  }

  @Get(':id/source-application')
  @ApiOperation({ summary: 'Get the source fresh application that originated this license' })
  @ApiParam({ name: 'id', description: 'License ID' })
  async getLicenseSourceApplication(@Param('id') id: string) {
    const app = await this.licensesService.getLicenseSourceApplication(Number(id));
    if (!app) throw new NotFoundException('Source application not found');
    return app;
  }
}
