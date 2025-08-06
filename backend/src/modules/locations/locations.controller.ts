import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // States API - GET /api/locations/states?id=1 (optional)
  @Get('states')
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

  // Districts API - GET /api/locations/districts?id=1&stateId=1 (both optional)
  @Get('districts')
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

  // Zones API - GET /api/locations/zones?id=1&districtId=1 (both optional)
  @Get('zones')
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

  // Divisions API - GET /api/locations/divisions?id=1&zoneId=1 (both optional)
  @Get('divisions')
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

  // Police Stations API - GET /api/locations/police-stations?id=1&divisionId=1 (both optional)
  @Get('police-stations')
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

