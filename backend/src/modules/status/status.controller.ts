import { Controller, Get, Post, Patch,  Param,  Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { Statuses } from '@prisma/client';
import { CacheResponse, InvalidateCache } from '../../cache/cache.decorators';
import { CacheKeys } from '../../cache/cache';

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Post()
  @InvalidateCache(CacheKeys.statuses)
  @ApiOperation({
    summary: 'Create status',
    description: 'Create a new status entry'
  })
  @ApiBody({
    description: 'Status creation data',
    examples: {
      'New Status': {
        summary: 'A new status entry',
        value: {
          name: 'New Status',
          description: 'A newly created status',
          code: 'NEW',
          isActive: true
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Status created successfully',
  })
  async createStatus(@Body() statusData: Statuses) {
    return this.statusService.createStatus(statusData);
  }

  @Get()
  @CacheResponse(CacheKeys.statuses, 3600)
  @ApiOperation({ 
    summary: 'Get status', 
    description: 'Retrieve the current status of the application'
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Filter by status code (partial match, case insensitive)',
    example: 'PENDING'
  })

  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    
  })
  async getStatus(@Query('code') code?: string) {
    return this.statusService.getStatus(code);
  }

  @Patch(':id')
  @InvalidateCache(CacheKeys.statuses)
  @ApiOperation({
    summary: 'Update status',
    description: 'Update an existing status entry'
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  @ApiBody({
    description: 'Status update data',
    examples: {
      'Update Status': {
        summary: 'Update an existing status entry',
        value: {
          code: 'ACTIVE',
          name: 'Updated Status',
          description: 'An updated status entry',
          isActive: true
        }
      }
    }
  })
  async updateStatus(@Param('id') id: string, @Body() statusData: any) {
    return this.statusService.updateStatus(Number(id), statusData);
  }
}
