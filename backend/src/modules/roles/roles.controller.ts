import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieve roles with optional filtering, search, and pagination'
  })
  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Filter by role id',
    example: '1'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by role name or code',
    example: 'admin'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (active/inactive)',
    example: 'active'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: '1'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: '10'
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (name, code, created_at, updated_at)',
    example: 'created_at'
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc/desc)',
    example: 'desc'
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async getRoles(
    @Query('id') id?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Req() req?: any,
  ) {
    try {
      // Extract roleCode from JWT for role-based filtering
      const user = req ? (req as any).user : null;
      const roleCode = user?.roleCode;

      return await this.rolesService.getRoles({
        id,
        search,
        status,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        requestingRoleCode: roleCode,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieve a specific role by its ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async getRoleById(@Param('id') id: string) {
    try {
      const role = await this.rolesService.getRoleById(Number(id));
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      return role;
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Create a new role with permissions and capabilities'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Inspector' },
        code: { type: 'string', description: 'Auto-generated if not provided', example: 'inspector' },
        dashboard_title: { type: 'string', example: 'Inspector Dashboard' },
        description: { type: 'string', description: 'Optional role description' },
        permissions: { type: 'object', description: 'Permission flags as JSON' },
        can_forward: { type: 'boolean', default: false },
        can_FLAF: { type: 'boolean', default: false },
        can_generate_ground_report: { type: 'boolean', default: false },
        can_re_enquiry: { type: 'boolean', default: false },
        can_access_settings: { type: 'boolean', default: false },
        menu_items: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'dashboard_title'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async createRole(@Body() roleData: any) {
    try {
      if (!roleData.name || !roleData.dashboard_title) {
        throw new BadRequestException('Name and dashboard_title are required');
      }
      return await this.rolesService.createRole(roleData);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an existing role',
    description: 'Update role details, permissions, and capabilities'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        dashboard_title: { type: 'string' },
        description: { type: 'string' },
        permissions: { type: 'object' },
        can_forward: { type: 'boolean' },
        can_FLAF: { type: 'boolean' },
        can_generate_ground_report: { type: 'boolean' },
        can_re_enquiry: { type: 'boolean' },
        can_access_settings: { type: 'boolean' },
        is_active: { type: 'boolean' },
        menu_items: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async updateRole(@Param('id') id: string, @Body() roleData: any) {
    try {
      return await this.rolesService.updateRole(Number(id), roleData);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Soft-delete a role by setting is_active to false'
  })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async deleteRole(@Param('id') id: string) {
    try {
      return await this.rolesService.deleteRole(Number(id));
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a role',
    description: 'Set a role as inactive without deleting it'
  })
  @ApiResponse({
    status: 200,
    description: 'Role deactivated successfully',
  })
  async deactivateRole(@Param('id') id: string) {
    try {
      return await this.rolesService.deactivateRole(Number(id));
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate a role',
    description: 'Set a role as active'
  })
  @ApiResponse({
    status: 200,
    description: 'Role activated successfully',
  })
  async activateRole(@Param('id') id: string) {
    try {
      return await this.rolesService.activateRole(Number(id));
    } catch (error) {
      throw error;
    }
  }
}
