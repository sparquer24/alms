import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FlowMappingService } from './flow-mapping.service';
import { CreateFlowMappingDto, UpdateFlowMappingDto, ValidateFlowMappingDto } from './dto/flow-mapping.dto';

@ApiTags('Flow Mapping')
@Controller('flow-mapping')
export class FlowMappingController {
    constructor(private readonly flowMappingService: FlowMappingService) { }

    /**
     * Get flow mapping for a specific role
     */
    @Get(':roleId')
    @ApiOperation({
        summary: 'Get flow mapping for a role',
        description: 'Retrieve workflow mapping configuration for a specific role',
    })
    @ApiResponse({
        status: 200,
        description: 'Flow mapping retrieved successfully',
        example: {
            id: 1,
            currentRoleId: 1,
            currentRole: { id: 1, name: 'DCP', code: 'DCP' },
            nextRoleIds: [2, 3],
            updatedBy: 5,
            updatedByUser: { id: 5, username: 'admin', email: 'admin@example.com' },
            updatedAt: '2025-01-15T10:30:00Z',
            createdAt: '2025-01-10T08:00:00Z',
        },
    })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async getFlowMapping(@Param('roleId', ParseIntPipe) roleId: number) {
        try {
            const result = await this.flowMappingService.getFlowMapping(roleId);
            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Get all flow mappings
     */
    @Get()
    @ApiOperation({
        summary: 'Get all flow mappings',
        description: 'Retrieve all role workflow mappings in the system',
    })
    @ApiResponse({
        status: 200,
        description: 'All flow mappings retrieved successfully',
        example: [
            {
                id: 1,
                currentRoleId: 1,
                nextRoleIds: [2, 3],
                updatedAt: '2025-01-15T10:30:00Z',
            },
        ],
    })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async getAllFlowMappings() {
        try {
            const result = await this.flowMappingService.getAllFlowMappings();
            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Create or update flow mapping
     */
    @Put(':roleId')
    @ApiOperation({
        summary: 'Create or update flow mapping for a role',
        description: 'Set the next roles that can receive applications from the current role',
    })
    @ApiBody({ type: UpdateFlowMappingDto })
    @ApiResponse({
        status: 200,
        description: 'Flow mapping created/updated successfully',
        example: {
            id: 1,
            currentRoleId: 1,
            nextRoleIds: [2, 3],
            updatedAt: '2025-01-15T10:30:00Z',
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid role IDs or circular dependency' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async updateFlowMapping(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body() updateDto: UpdateFlowMappingDto,
    ) {
        try {
            const result = await this.flowMappingService.createOrUpdateFlowMapping(
                roleId,
                updateDto,
                updateDto.updatedBy,
            );
            return {
                success: true,
                message: 'Flow mapping updated successfully',
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Create flow mapping
     */
    @Post()
    @ApiOperation({
        summary: 'Create flow mapping',
        description: 'Create a new workflow mapping for a role',
    })
    @ApiBody({ type: CreateFlowMappingDto })
    @ApiResponse({
        status: 201,
        description: 'Flow mapping created successfully',
        example: {
            id: 1,
            currentRoleId: 1,
            nextRoleIds: [2, 3],
            createdAt: '2025-01-15T10:30:00Z',
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid role IDs or circular dependency' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async createFlowMapping(@Body() createDto: CreateFlowMappingDto) {
        try {
            const result = await this.flowMappingService.createOrUpdateFlowMapping(
                createDto.currentRoleId,
                createDto,
            );
            return {
                success: true,
                message: 'Flow mapping created successfully',
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Validate flow mapping for circular dependencies
     */
    @Post('validate')
    @ApiOperation({
        summary: 'Validate flow mapping',
        description: 'Check if a proposed flow mapping would create circular dependencies',
    })
    @ApiBody({ type: ValidateFlowMappingDto })
    @ApiResponse({
        status: 200,
        description: 'Validation result',
        example: {
            isValid: true,
            hasCircularDependency: false,
            circlePath: null,
            message: 'Flow mapping is valid',
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid role IDs' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async validateFlowMapping(@Body() validateDto: ValidateFlowMappingDto) {
        try {
            const result = await this.flowMappingService.validateFlowMapping(validateDto);
            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Delete flow mapping
     */
    @Delete(':roleId')
    @ApiOperation({
        summary: 'Delete flow mapping for a role',
        description: 'Remove the workflow mapping configuration for a role',
    })
    @ApiResponse({
        status: 200,
        description: 'Flow mapping deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Flow mapping not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async deleteFlowMapping(@Param('roleId', ParseIntPipe) roleId: number) {
        try {
            await this.flowMappingService.deleteFlowMapping(roleId);
            return {
                success: true,
                message: 'Flow mapping deleted successfully',
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Get next roles for a role
     */
    @Get(':roleId/next-roles')
    @ApiOperation({
        summary: 'Get next roles for a role',
        description: 'Retrieve which roles can receive applications from a specific role',
    })
    @ApiResponse({
        status: 200,
        description: 'Next roles retrieved successfully',
        example: {
            currentRoleId: 1,
            currentRoleName: 'DCP',
            nextRoles: [
                { id: 2, name: 'ACP', code: 'ACP' },
                { id: 3, name: 'SHO', code: 'SHO' },
            ],
        },
    })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async getNextRoles(@Param('roleId', ParseIntPipe) roleId: number) {
        try {
            const result = await this.flowMappingService.getNextRoles(roleId);
            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Duplicate flow mapping
     */
    @Post(':sourceRoleId/duplicate/:targetRoleId')
    @ApiOperation({
        summary: 'Duplicate flow mapping',
        description: 'Copy workflow mapping from one role to another',
    })
    @ApiResponse({
        status: 200,
        description: 'Flow mapping duplicated successfully',
    })
    @ApiResponse({ status: 400, description: 'Bad request - Circular dependency detected' })
    @ApiResponse({ status: 404, description: 'Source or target role not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async duplicateFlowMapping(
        @Param('sourceRoleId', ParseIntPipe) sourceRoleId: number,
        @Param('targetRoleId', ParseIntPipe) targetRoleId: number,
    ) {
        try {
            const result = await this.flowMappingService.duplicateFlowMapping(
                sourceRoleId,
                targetRoleId,
            );
            return {
                success: true,
                message: 'Flow mapping duplicated successfully',
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Reset flow mapping
     */
    @Post(':roleId/reset')
    @ApiOperation({
        summary: 'Reset flow mapping',
        description: 'Clear all next roles from a role mapping (set to empty)',
    })
    @ApiResponse({
        status: 200,
        description: 'Flow mapping reset successfully',
    })
    @ApiResponse({ status: 404, description: 'Flow mapping not found' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async resetFlowMapping(@Param('roleId', ParseIntPipe) roleId: number) {
        try {
            const result = await this.flowMappingService.resetFlowMapping(roleId);
            return {
                success: true,
                message: 'Flow mapping reset successfully',
                data: result,
            };
        } catch (error: any) {
            throw error;
        }
    }
}
