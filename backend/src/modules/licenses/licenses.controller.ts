import { Controller, Get, Post, Param, Query, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('generate/:sourceApplicationId')
  @ApiOperation({ summary: 'Generate a license PDF from a fresh application' })
  async generateLicense(
    @Param('sourceApplicationId') sourceApplicationId: string,
    @Body('issuedBy') issuedBy: string | number
  ) {
    return this.licensesService.generateLicensePdf(Number(sourceApplicationId), Number(issuedBy));
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
  @ApiQuery({ name: 'sourceApplicationId', required: false, type: Number, description: 'Filter by source application ID' })
  @ApiQuery({ name: 'orderBy', required: false, example: 'createdAt', enum: ['id', 'licenseNumber', 'firstName', 'lastName', 'createdAt', 'validTill', 'status'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], example: 'desc' })
  async getAllLicenses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('licenseNumber') licenseNumber?: string,
    @Query('aadharNumber') aadharNumber?: string,
    @Query('sourceApplicationId') sourceApplicationId?: string,
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
      sourceApplicationId: sourceApplicationId ? Number(sourceApplicationId) : undefined,
      orderBy,
      order,
    });
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get license statistics (counts by status)' })
  async getLicenseStatistics() {
    return this.licensesService.getLicenseStatistics();
  }

  @Get('by-number/:licenseNumber')
  @ApiOperation({ summary: 'Lookup a license by its license number' })
  @ApiParam({ name: 'licenseNumber', description: 'License number (e.g., LUAN-2026-...)', example: 'LUAN-2026-07-02-14-30-45-123456' })
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
  @ApiOperation({ summary: 'Get a license by ID with full details' })
  @ApiParam({ name: 'id', description: 'License ID' })
  async getLicenseById(@Param('id') id: string) {
    const license = await this.licensesService.getLicenseById(Number(id));
    if (!license) throw new NotFoundException('License not found');
    return license;
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get workflow history for a license' })
  @ApiParam({ name: 'id', description: 'License ID' })
  async getLicenseHistory(@Param('id') id: string) {
    const license = await this.licensesService.getLicenseById(Number(id));
    if (!license) throw new NotFoundException('License not found');
    return this.licensesService.getLicenseHistory(Number(id));
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
