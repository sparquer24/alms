import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('Public - Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class PublicRolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @ApiOperation({
        summary: 'Get all roles',
        description: 'Retrieve all available roles with optional filtering and pagination. Query parameters are optional.'
    })
    @ApiQuery({
        name: 'id',
        required: false,
        type: 'number',
        description: 'Filter by role id'
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: 'string',
        description: 'Search by role name or code'
    })
    @ApiQuery({
        name: 'status',
        required: false,
        type: 'string',
        description: 'Filter by status (active/inactive)'
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: 'number',
        description: 'Page number for pagination (default: 1)'
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: 'number',
        description: 'Items per page (default: 10)'
    })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: 'string',
        description: 'Sort field (name, code, created_at, updated_at)'
    })
    @ApiQuery({
        name: 'sortOrder',
        required: false,
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order'
    })
    @ApiResponse({
        status: 200,
        description: 'Roles retrieved successfully'
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid query parameters'
    })
    async getRoles(
        @Query('id') id?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
        @Req() req?: any,
    ) {
        // Extract role_code from JWT
        const user = req ? (req as any).user : null;
        const roleCode = user?.role_code;

        return await this.rolesService.getRoles({
            id: id ? Number(id) : undefined,
            search,
            status,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy,
            sortOrder: (sortOrder as 'asc' | 'desc') || undefined,
            requestingRoleCode: roleCode,
        });
    }
}
