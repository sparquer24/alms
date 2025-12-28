import { Controller, Get, Post, Put, Delete, Query, Body, Param, ParseIntPipe, HttpException, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) { }

  // States API - GET /locations/states?id=1 (optional)
  @Get('states')
  @ApiOperation({
    summary: 'Get States',
    description: 'Retrieve all states or a specific state by ID. SUPER_ADMIN sees all states, ADMIN sees empty list (starts from district)'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'State ID to retrieve specific state',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'States retrieved successfully',
    example: {
      success: true,
      message: 'States retrieved successfully',
      data: [
        { id: 1, name: 'West Bengal', code: 'WB' },
        { id: 2, name: 'Maharashtra', code: 'MH' }
      ],
      count: 2
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid state ID' })
  @ApiResponse({ status: 404, description: 'State not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStates(@Query('id') id?: string, @Request() req?: any) {
    try {
      const stateId = id ? parseInt(id, 10) : undefined;

      if (id && isNaN(stateId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid state ID',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await this.locationsService.getStates(stateId);

      if (id && !data) {
        throw new HttpException(
          {
            success: false,
            message: 'State not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: id ? 'State retrieved successfully' : 'States retrieved successfully',
        data,
        ...(Array.isArray(data) && { count: data.length })
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch states',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Districts API - GET /locations/districts?id=1&stateId=1 (both optional)
  @Get('districts')
  @ApiOperation({
    summary: 'Get Districts',
    description: 'Retrieve all districts or filter by state ID, or get specific district by ID'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'District ID to retrieve specific district',
    example: '1'
  })
  @ApiQuery({
    name: 'stateId',
    required: false,
    description: 'State ID to filter districts by state',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'Districts retrieved successfully',
    example: {
      success: true,
      message: 'Districts retrieved successfully',
      data: [
        { id: 1, name: 'Kolkata', stateId: 1 },
        { id: 2, name: 'Howrah', stateId: 1 }
      ],
      count: 2,
      filters: { stateId: 1 }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid district ID or state ID' })
  @ApiResponse({ status: 404, description: 'District not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getDistricts(
    @Query('id') id?: string,
    @Query('stateId') stateId?: string
  ) {
    try {
      const districtId = id ? parseInt(id, 10) : undefined;
      const filterStateId = stateId ? parseInt(stateId, 10) : undefined;

      if (id && isNaN(districtId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid district ID',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (stateId && isNaN(filterStateId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid state ID filter',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await this.locationsService.getDistricts(districtId, filterStateId);

      if (id && !data) {
        throw new HttpException(
          {
            success: false,
            message: 'District not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: id ? 'District retrieved successfully' : 'Districts retrieved successfully',
        data,
        ...(Array.isArray(data) && { count: data.length }),
        ...(stateId && { filters: { stateId: filterStateId } })
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch districts',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Zones API - GET /locations/zones?id=1&districtId=1 (both optional)
  @Get('zones')
  @ApiOperation({
    summary: 'Get Zones',
    description: 'Retrieve all zones or filter by district ID, or get specific zone by ID'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Zone ID to retrieve specific zone',
    example: '1'
  })
  @ApiQuery({
    name: 'districtId',
    required: false,
    description: 'District ID to filter zones by district',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
    example: {
      success: true,
      message: 'Zones retrieved successfully',
      data: [
        { id: 1, name: 'North Zone', districtId: 1 },
        { id: 2, name: 'South Zone', districtId: 1 }
      ],
      count: 2,
      filters: { districtId: 1 }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid zone ID or district ID' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getZones(
    @Query('id') id?: string,
    @Query('districtId') districtId?: string
  ) {
    try {
      const zoneId = id ? parseInt(id, 10) : undefined;
      const filterDistrictId = districtId ? parseInt(districtId, 10) : undefined;

      if (id && isNaN(zoneId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid zone ID',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (districtId && isNaN(filterDistrictId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid district ID filter',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await this.locationsService.getZones(zoneId, filterDistrictId);

      if (id && !data) {
        throw new HttpException(
          {
            success: false,
            message: 'Zone not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: id ? 'Zone retrieved successfully' : 'Zones retrieved successfully',
        data,
        ...(Array.isArray(data) && { count: data.length }),
        ...(districtId && { filters: { districtId: filterDistrictId } })
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch zones',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Divisions API - GET /locations/divisions?id=1&zoneId=1 (both optional)
  @Get('divisions')
  @ApiOperation({
    summary: 'Get Divisions',
    description: 'Retrieve all divisions or filter by zone ID, or get specific division by ID'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Division ID to retrieve specific division',
    example: '1'
  })
  @ApiQuery({
    name: 'zoneId',
    required: false,
    description: 'Zone ID to filter divisions by zone',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'Divisions retrieved successfully',
    example: {
      success: true,
      message: 'Divisions retrieved successfully',
      data: [
        { id: 1, name: 'Central Division', zoneId: 1 },
        { id: 2, name: 'East Division', zoneId: 1 }
      ],
      count: 2,
      filters: { zoneId: 1 }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid division ID or zone ID' })
  @ApiResponse({ status: 404, description: 'Division not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getDivisions(
    @Query('id') id?: string,
    @Query('zoneId') zoneId?: string
  ) {
    try {
      const divisionId = id ? parseInt(id, 10) : undefined;
      const filterZoneId = zoneId ? parseInt(zoneId, 10) : undefined;

      if (id && isNaN(divisionId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid division ID',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (zoneId && isNaN(filterZoneId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid zone ID filter',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await this.locationsService.getDivisions(divisionId, filterZoneId);

      if (id && !data) {
        throw new HttpException(
          {
            success: false,
            message: 'Division not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: id ? 'Division retrieved successfully' : 'Divisions retrieved successfully',
        data,
        ...(Array.isArray(data) && { count: data.length }),
        ...(zoneId && { filters: { zoneId: filterZoneId } })
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch divisions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Police Stations API - GET /locations/police-stations?id=1&divisionId=1 (both optional)
  @Get('police-stations')
  @ApiOperation({
    summary: 'Get Police Stations',
    description: 'Retrieve all police stations or filter by division ID, or get specific police station by ID'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Police Station ID to retrieve specific police station',
    example: '1'
  })
  @ApiQuery({
    name: 'divisionId',
    required: false,
    description: 'Division ID to filter police stations by division',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'Police stations retrieved successfully',
    example: {
      success: true,
      message: 'Police stations retrieved successfully',
      data: [
        { id: 1, name: 'Lalbazar Police Station', divisionId: 1 },
        { id: 2, name: 'Bowbazar Police Station', divisionId: 1 }
      ],
      count: 2,
      filters: { divisionId: 1 }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid police station ID or division ID' })
  @ApiResponse({ status: 404, description: 'Police station not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPoliceStations(
    @Query('id') id?: string,
    @Query('divisionId') divisionId?: string
  ) {
    try {
      const stationId = id ? parseInt(id, 10) : undefined;
      const filterDivisionId = divisionId ? parseInt(divisionId, 10) : undefined;

      if (id && isNaN(stationId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid police station ID',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (divisionId && isNaN(filterDivisionId!)) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid division ID filter',
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const data = await this.locationsService.getPoliceStations(stationId, filterDivisionId);

      if (id && !data) {
        throw new HttpException(
          {
            success: false,
            message: 'Police station not found',
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: id ? 'Police station retrieved successfully' : 'Police stations retrieved successfully',
        data,
        ...(Array.isArray(data) && { count: data.length }),
        ...(divisionId && { filters: { divisionId: filterDivisionId } })
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch police stations',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Enhanced: Get location hierarchy for a specific location type and ID
  @Get('hierarchy')
  @ApiOperation({
    summary: 'Get Location Hierarchy',
    description: 'Get the complete location hierarchy for a specific location. Provide only one location ID parameter.'
  })
  @ApiQuery({
    name: 'stateId',
    required: false,
    description: 'State ID to get hierarchy from state level',
    example: '1'
  })
  @ApiQuery({
    name: 'districtId',
    required: false,
    description: 'District ID to get hierarchy from district level',
    example: '1'
  })
  @ApiQuery({
    name: 'zoneId',
    required: false,
    description: 'Zone ID to get hierarchy from zone level',
    example: '1'
  })
  @ApiQuery({
    name: 'divisionId',
    required: false,
    description: 'Division ID to get hierarchy from division level',
    example: '1'
  })
  @ApiQuery({
    name: 'policeStationId',
    required: false,
    description: 'Police Station ID to get complete hierarchy',
    example: '1'
  })
  @ApiResponse({
    status: 200,
    description: 'Location hierarchy retrieved successfully',
    example: {
      success: true,
      message: 'Location hierarchy retrieved successfully',
      data: {
        state: { id: 1, name: 'West Bengal' },
        district: { id: 1, name: 'Kolkata' },
        zone: { id: 1, name: 'North Zone' },
        division: { id: 1, name: 'Central Division' },
        policeStation: { id: 1, name: 'Lalbazar Police Station' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Please provide only one location ID at a time' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLocationHierarchy(
    @Query('stateId') stateId?: string,
    @Query('districtId') districtId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('policeStationId') policeStationId?: string
  ) {
    try {
      // Only one ID should be provided at a time
      const ids = [stateId, districtId, zoneId, divisionId, policeStationId].filter(Boolean);
      if (ids.length > 1) {
        throw new HttpException(
          {
            success: false,
            message: 'Please provide only one location ID at a time',
          },
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await this.locationsService.getLocationHierarchy({
        stateId: stateId ? parseInt(stateId, 10) : undefined,
        districtId: districtId ? parseInt(districtId, 10) : undefined,
        zoneId: zoneId ? parseInt(zoneId, 10) : undefined,
        divisionId: divisionId ? parseInt(divisionId, 10) : undefined,
        policeStationId: policeStationId ? parseInt(policeStationId, 10) : undefined,
      });
      return {
        success: true,
        message: 'Location hierarchy retrieved successfully',
        data
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch location hierarchy',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* ===== CREATE ENDPOINTS ===== */

  @Post('states')
  @ApiOperation({ summary: 'Create State' })
  @ApiResponse({ status: 201, description: 'State created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createState(@Body() body: { name: string }) {
    try {
      const data = await this.locationsService.createState(body.name);
      return {
        success: true,
        message: 'State created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create state',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('districts')
  @ApiOperation({ summary: 'Create District' })
  @ApiResponse({ status: 201, description: 'District created successfully' })
  async createDistrict(@Body() body: { name: string; parentId?: number; stateId?: number }) {
    try {
      const stateId = body.parentId || body.stateId;
      if (!stateId) {
        throw new HttpException(
          { success: false, message: 'stateId (or parentId) is required' },
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await this.locationsService.createDistrict(stateId, body.name);
      return {
        success: true,
        message: 'District created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create district' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('zones')
  @ApiOperation({ summary: 'Create Zone' })
  @ApiResponse({ status: 201, description: 'Zone created successfully' })
  async createZone(@Body() body: { name: string; parentId?: number; districtId?: number }) {
    try {
      const districtId = body.parentId || body.districtId;
      if (!districtId) {
        throw new HttpException(
          { success: false, message: 'districtId (or parentId) is required' },
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await this.locationsService.createZone(districtId, body.name);
      return {
        success: true,
        message: 'Zone created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create zone' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('divisions')
  @ApiOperation({ summary: 'Create Division' })
  @ApiResponse({ status: 201, description: 'Division created successfully' })
  async createDivision(@Body() body: { name: string; parentId?: number; zoneId?: number }) {
    try {
      const zoneId = body.parentId || body.zoneId;
      if (!zoneId) {
        throw new HttpException(
          { success: false, message: 'zoneId (or parentId) is required' },
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await this.locationsService.createDivision(zoneId, body.name);
      return {
        success: true,
        message: 'Division created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create division' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('police-stations')
  @ApiOperation({ summary: 'Create Police Station' })
  @ApiResponse({ status: 201, description: 'Police Station created successfully' })
  async createPoliceStation(@Body() body: { name: string; parentId?: number; divisionId?: number }) {
    try {
      const divisionId = body.parentId || body.divisionId;
      if (!divisionId) {
        throw new HttpException(
          { success: false, message: 'divisionId (or parentId) is required' },
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await this.locationsService.createPoliceStation(divisionId, body.name);
      return {
        success: true,
        message: 'Police Station created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to create police station' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* ===== UPDATE ENDPOINTS ===== */

  @Put('states/:id')
  @ApiOperation({ summary: 'Update State' })
  @ApiResponse({ status: 200, description: 'State updated successfully' })
  async updateState(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    try {
      const data = await this.locationsService.updateState(id, body.name);
      return {
        success: true,
        message: 'State updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update state' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('districts/:id')
  @ApiOperation({ summary: 'Update District' })
  @ApiResponse({ status: 200, description: 'District updated successfully' })
  async updateDistrict(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    try {
      const data = await this.locationsService.updateDistrict(id, body.name);
      return {
        success: true,
        message: 'District updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update district' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('zones/:id')
  @ApiOperation({ summary: 'Update Zone' })
  @ApiResponse({ status: 200, description: 'Zone updated successfully' })
  async updateZone(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    try {
      const data = await this.locationsService.updateZone(id, body.name);
      return {
        success: true,
        message: 'Zone updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update zone' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('divisions/:id')
  @ApiOperation({ summary: 'Update Division' })
  @ApiResponse({ status: 200, description: 'Division updated successfully' })
  async updateDivision(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    try {
      const data = await this.locationsService.updateDivision(id, body.name);
      return {
        success: true,
        message: 'Division updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update division' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('police-stations/:id')
  @ApiOperation({ summary: 'Update Police Station' })
  @ApiResponse({ status: 200, description: 'Police Station updated successfully' })
  async updatePoliceStation(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    try {
      const data = await this.locationsService.updatePoliceStation(id, body.name);
      return {
        success: true,
        message: 'Police Station updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to update police station' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* ===== DELETE ENDPOINTS ===== */

  @Delete('states/:id')
  @ApiOperation({ summary: 'Delete State' })
  @ApiResponse({ status: 200, description: 'State deleted successfully' })
  async deleteState(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.locationsService.deleteState(id);
      return {
        success: true,
        message: 'State deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete state' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('districts/:id')
  @ApiOperation({ summary: 'Delete District' })
  @ApiResponse({ status: 200, description: 'District deleted successfully' })
  async deleteDistrict(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.locationsService.deleteDistrict(id);
      return {
        success: true,
        message: 'District deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete district' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('zones/:id')
  @ApiOperation({ summary: 'Delete Zone' })
  @ApiResponse({ status: 200, description: 'Zone deleted successfully' })
  async deleteZone(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.locationsService.deleteZone(id);
      return {
        success: true,
        message: 'Zone deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete zone' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('divisions/:id')
  @ApiOperation({ summary: 'Delete Division' })
  @ApiResponse({ status: 200, description: 'Division deleted successfully' })
  async deleteDivision(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.locationsService.deleteDivision(id);
      return {
        success: true,
        message: 'Division deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete division' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('police-stations/:id')
  @ApiOperation({ summary: 'Delete Police Station' })
  @ApiResponse({ status: 200, description: 'Police Station deleted successfully' })
  async deletePoliceStation(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.locationsService.deletePoliceStation(id);
      return {
        success: true,
        message: 'Police Station deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message || 'Failed to delete police station' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

