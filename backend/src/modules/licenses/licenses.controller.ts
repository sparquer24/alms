import { Controller, Get, Post, Param, Query, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('generate/:freshApplicationId')
  @ApiOperation({ summary: 'Generate a license PDF from a fresh application' })
  async generateLicense(
    @Param('freshApplicationId') freshApplicationId: string,
    @Body('issuedBy') issuedBy: string | number
  ) {
    return this.licensesService.generateLicensePdf(Number(freshApplicationId), Number(issuedBy));
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
  ) {
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
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get license dashboard counts and expiry buckets' })
  async getLicenseDashboard() {
    return this.licensesService.getLicenseStatistics();
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
  ) {
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
  ) {
    return this.licensesService.getAllLicenses({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status: 'EXPIRED',
      purpose,
      renewedOnly: renewedOnly === 'true',
      orderBy: 'validTill',
      order: 'desc',
    });
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get license statistics (counts by status)' })
  async getLicenseStatistics() {
    return this.licensesService.getLicenseStatistics();
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
  ) {
    return this.licensesService.getLicenseAuditLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      action,
      dateFrom,
      dateTo,
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
