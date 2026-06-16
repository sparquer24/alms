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
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FlowMappingService } from './flow-mapping.service';
import { CreateFlowMappingDto, UpdateFlowMappingDto, ValidateFlowMappingDto } from './dto/flow-mapping.dto';

@ApiTags('Flow Mapping')
@Controller('flow-mapping')
export class FlowMappingController {
    constructor(private readonly flowMappingService: FlowMappingService) { }

    @Get(':roleId')
    @ApiOperation({ summary: 'Get flow mapping for a role with optional app type/category/workflow filters' })
    @ApiQuery({ name: 'applicationTypeId', required: false, type: Number })
    @ApiQuery({ name: 'categoryId', required: false, type: Number })
    @ApiQuery({ name: 'workflowId', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Flow mapping retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    async getFlowMapping(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Query('applicationTypeId') applicationTypeId?: string,
        @Query('categoryId') categoryId?: string,
        @Query('workflowId') workflowId?: string,
    ) {
        const result = await this.flowMappingService.getFlowMapping(
            roleId,
            applicationTypeId ? parseInt(applicationTypeId) : undefined,
            categoryId ? parseInt(categoryId) : undefined,
            workflowId ? parseInt(workflowId) : undefined,
        );
        return { success: true, data: result };
    }

    @Get()
    @ApiOperation({ summary: 'Get all flow mappings' })
    async getAllFlowMappings() {
        const result = await this.flowMappingService.getAllFlowMappings();
        return { success: true, data: result };
    }

    @Put(':roleId')
    @ApiOperation({ summary: 'Create or update flow mapping' })
    @ApiBody({ type: UpdateFlowMappingDto })
    async updateFlowMapping(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body() updateDto: UpdateFlowMappingDto,
    ) {
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
    }

    @Post()
    @ApiOperation({ summary: 'Create flow mapping' })
    @ApiBody({ type: CreateFlowMappingDto })
    async createFlowMapping(@Body() createDto: CreateFlowMappingDto) {
        const result = await this.flowMappingService.createOrUpdateFlowMapping(
            createDto.currentRoleId,
            createDto,
        );
        return {
            success: true,
            message: 'Flow mapping created successfully',
            data: result,
        };
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate flow mapping' })
    @ApiBody({ type: ValidateFlowMappingDto })
    async validateFlowMapping(@Body() validateDto: ValidateFlowMappingDto) {
        const result = await this.flowMappingService.validateFlowMapping(validateDto);
        return { success: true, data: result };
    }

    @Delete(':roleId')
    @ApiOperation({ summary: 'Delete flow mapping' })
    async deleteFlowMapping(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Query('applicationTypeId') applicationTypeId?: string,
        @Query('categoryId') categoryId?: string,
        @Query('workflowId') workflowId?: string,
    ) {
        await this.flowMappingService.deleteFlowMapping(
            roleId,
            applicationTypeId ? parseInt(applicationTypeId) : undefined,
            categoryId ? parseInt(categoryId) : undefined,
            workflowId ? parseInt(workflowId) : undefined,
        );
        return { success: true, message: 'Flow mapping deleted successfully' };
    }

    @Get(':roleId/next-roles')
    @ApiOperation({ summary: 'Get next roles for a role' })
    async getNextRoles(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Query('applicationTypeId') applicationTypeId?: string,
        @Query('categoryId') categoryId?: string,
        @Query('workflowId') workflowId?: string,
    ) {
        const result = await this.flowMappingService.getNextRoles(
            roleId,
            applicationTypeId ? parseInt(applicationTypeId) : undefined,
            categoryId ? parseInt(categoryId) : undefined,
            workflowId ? parseInt(workflowId) : undefined,
        );
        return { success: true, data: result };
    }

    @Post(':sourceRoleId/duplicate/:targetRoleId')
    @ApiOperation({ summary: 'Duplicate flow mapping' })
    async duplicateFlowMapping(
        @Param('sourceRoleId', ParseIntPipe) sourceRoleId: number,
        @Param('targetRoleId', ParseIntPipe) targetRoleId: number,
        @Query('applicationTypeId') applicationTypeId?: string,
        @Query('categoryId') categoryId?: string,
        @Query('workflowId') workflowId?: string,
    ) {
        const result = await this.flowMappingService.duplicateFlowMapping(
            sourceRoleId,
            targetRoleId,
            undefined,
            applicationTypeId ? parseInt(applicationTypeId) : undefined,
            categoryId ? parseInt(categoryId) : undefined,
            workflowId ? parseInt(workflowId) : undefined,
        );
        return { success: true, message: 'Flow mapping duplicated successfully', data: result };
    }

    @Post(':roleId/reset')
    @ApiOperation({ summary: 'Reset flow mapping' })
    async resetFlowMapping(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Query('applicationTypeId') applicationTypeId?: string,
        @Query('categoryId') categoryId?: string,
        @Query('workflowId') workflowId?: string,
    ) {
        const result = await this.flowMappingService.resetFlowMapping(
            roleId,
            applicationTypeId ? parseInt(applicationTypeId) : undefined,
            categoryId ? parseInt(categoryId) : undefined,
            workflowId ? parseInt(workflowId) : undefined,
        );
        return { success: true, message: 'Flow mapping reset successfully', data: result };
    }
}
