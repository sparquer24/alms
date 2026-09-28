import { Controller, Get, Post, Put, Delete, Param, Query, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all permissions',
    description: 'Retrieve the permission catalog, each with the roles currently assigned it',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by key, label, or description' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getPermissions(@Query('search') search?: string, @Query('category') category?: string) {
    return this.permissionsService.getPermissions({ search, category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getPermissionById(@Param('id') id: string) {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      throw new BadRequestException(`Invalid permission id: "${id}"`);
    }
    const permission = await this.permissionsService.getPermissionById(numericId);
    if (!permission) {
      throw new BadRequestException('Permission not found');
    }
    return permission;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new permission definition' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'canViewFreshForm' },
        label: { type: 'string', example: 'View Fresh Forms' },
        category: { type: 'string', example: 'View Permissions' },
        description: { type: 'string' },
      },
      required: ['key', 'label', 'category'],
    },
  })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createPermission(@Body() body: { key: string; label: string; category: string; description?: string }) {
    return this.permissionsService.createPermission(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing permission definition' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        label: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('id') id: string,
    @Body() body: { key?: string; label?: string; category?: string; description?: string; isActive?: boolean },
  ) {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      throw new BadRequestException(`Invalid permission id: "${id}"`);
    }
    return this.permissionsService.updatePermission(numericId, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a permission definition',
    description: 'Removes the permission from the catalog. Does not retroactively strip the flag from roles that already have it set.',
  })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async deletePermission(@Param('id') id: string) {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      throw new BadRequestException(`Invalid permission id: "${id}"`);
    }
    return this.permissionsService.deletePermission(numericId);
  }
}
