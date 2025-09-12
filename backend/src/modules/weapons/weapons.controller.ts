import { Controller, Get, Post, Patch,  Param,  Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WeaponsService } from './weapons.service';
import { WeaponsModule } from './weapons.module';

@ApiTags('Weapons')
@Controller('Weapons')
export class WeaponsController {
  constructor(private readonly weaponsService: WeaponsService) {}

  @Get()
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
    try{
    return this.weaponsService.getWeapons(id);
  }
  catch(error){
    throw error;
   }
 }
}
