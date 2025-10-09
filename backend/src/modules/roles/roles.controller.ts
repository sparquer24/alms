import {Controller, Get, Post, Patch, Param, Query, Body } from  '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RolesModule } from './roles.module';

@ApiTags('Roles')
@Controller('Roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
    @Get()
    @ApiOperation({ 
      summary: "Get all roles", 
      description: "Retrieve the current roles of the application"
    })
    @ApiQuery({
      name: 'id',
      required: false,
      description: 'Filter by roles id',
      example: '0'
    })
    @ApiResponse({
        status: 200,
        description: 'Status retrieved successfully',
    })
    async getRoles(@Query('id') id?: number){
      try{
        return this.rolesService.getRoles(id);
        }
        catch(error){
            throw error;
        }
    }
}
