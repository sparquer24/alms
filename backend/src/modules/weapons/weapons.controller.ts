import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WeaponsService } from './weapons.service';
import { CacheResponse } from '../../cache/cache.decorators';
import { CacheKeys } from '../../cache/cache';

@ApiTags('Weapons')
@Controller('Weapons')
export class WeaponsController {
  constructor(private readonly weaponsService: WeaponsService) {}

  @Get()
  @CacheResponse(CacheKeys.weapons, 3600)
  @ApiOperation({ 
    summary: "Get all weapons", 
    description: "Retrieve the current weapons of the application"
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Filter by weapons id',
    example: '0'
  })

  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    
  })
  async getWeapons(@Query('id') id?: number){
    return this.weaponsService.getWeapons(id);
  }
}
