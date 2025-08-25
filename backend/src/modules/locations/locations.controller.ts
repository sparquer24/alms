import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // States API - GET /locations/states?id=1 (optional)
  @Get('states')
  @ApiOperation({ 
    summary: 'Get States', 
    description: 'Retrieve all states or a specific state by ID' 
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
  async getStates(@Query('id') id?: string) {
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
}

