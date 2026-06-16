import { Controller, Get, Post, Put, Patch, Delete, Request, UseGuards, Body, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { Actiones } from "@prisma/client";
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';

@ApiTags("Actiones")
@ApiBearerAuth('JWT-auth')
@Controller("actiones")
export class ActionesController {
  constructor(private readonly actionesService: ActionesService) {}

  // ===================== WORKFLOW ACTION SELECTION =====================

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get actions for user",
    description: "Retrieve actions for the authenticated user (based on token). Optionally filter based on application status.",
  })
  @ApiQuery({ 
    name: 'applicationId', 
    required: false, 
    type: Number, 
    description: 'Optional applicationId to filter actions based on application status'
  })
  @ApiResponse({ status: 200, description: "Actions retrieved successfully" })
  async getActiones(
    @Request() req: any,
    @Query('applicationId') applicationId?: string
  ): Promise<Actiones[]> {
    const tokenUserId = req.user && (req.user as any).sub ? Number((req.user as any).sub) : undefined;
    return this.actionesService.getActiones(
      tokenUserId,
      applicationId ? Number(applicationId) : undefined
    );
  }

  // ===================== ADMIN: ACTION CRUD =====================

  @Get("admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get all actions (admin)",
    description: "Get paginated list of all actions with search, filter, and sort capabilities",
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, code, or description' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'all'], description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  @ApiResponse({ status: 200, description: "Paginated actions list" })
  async getAllActions(
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.actionesService.getAllActions({
      search,
      status: status || 'all',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get action by ID", description: "Retrieve a single action by its ID" })
  @ApiResponse({ status: 200, description: "Action found" })
  @ApiResponse({ status: 404, description: "Action not found" })
  async getActionById(@Param('id') id: string) {
    return this.actionesService.getActionById(Number(id));
  }

  @Post("entity")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Create a new action", description: "Create a new action entity" })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'code'],
      properties: {
        name: { type: 'string', example: 'Forward', description: 'Action display name' },
        code: { type: 'string', example: 'FORWARD', description: 'Unique action code (uppercase)' },
        description: { type: 'string', example: 'Forward application to next role', description: 'Action description' },
        isActive: { type: 'boolean', example: true, description: 'Whether action is active' },
      }
    }
  })
  @ApiResponse({ status: 201, description: "Action created successfully" })
  @ApiResponse({ status: 409, description: "Action with this code already exists" })
  async createActionEntity(@Body() data: { name: string; code: string; description?: string; isActive?: boolean }) {
    return this.actionesService.createActionEntity(data);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update an action", description: "Update an existing action's details" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Forward', description: 'Action display name' },
        code: { type: 'string', example: 'FORWARD', description: 'Unique action code' },
        description: { type: 'string', example: 'Forward application to next role', description: 'Action description' },
        isActive: { type: 'boolean', example: true, description: 'Whether action is active' },
      }
    }
  })
  @ApiResponse({ status: 200, description: "Action updated successfully" })
  @ApiResponse({ status: 404, description: "Action not found" })
  async updateActionEntity(@Param('id') id: string, @Body() data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    return this.actionesService.updateActionEntity(Number(id), data);
  }

  @Put(":id/toggle-status")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Toggle action status", description: "Toggle an action between active and inactive" })
  @ApiResponse({ status: 200, description: "Action status toggled" })
  @ApiResponse({ status: 404, description: "Action not found" })
  async toggleActionStatus(@Param('id') id: string) {
    return this.actionesService.toggleActionStatus(Number(id));
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Delete an action", description: "Soft delete (deactivate) an action" })
  @ApiResponse({ status: 200, description: "Action deactivated" })
  @ApiResponse({ status: 404, description: "Action not found" })
  async deleteAction(@Param('id') id: string) {
    return this.actionesService.deleteAction(Number(id));
  }

  // ===================== ROLE-ACTION MAPPING =====================

  @Get("roles/:roleId/mappings")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: "Get role-action mappings", 
    description: "Get all action mappings for a specific role, including mapped action details" 
  })
  @ApiQuery({ name: 'applicationTypeId', required: false, type: Number, description: 'Filter by application type' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: "Role with its action mappings" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async getRoleActionMappings(
    @Param('roleId') roleId: string,
    @Query('applicationTypeId') applicationTypeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.actionesService.getRoleActionMappings(
      Number(roleId),
      applicationTypeId ? Number(applicationTypeId) : undefined,
      categoryId ? Number(categoryId) : undefined,
    );
  }

  @Get("roles/:roleId/available")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: "Get available actions for role", 
    description: "Get all actions that are NOT yet mapped to the specified role" 
  })
  @ApiQuery({ name: 'applicationTypeId', required: false, type: Number, description: 'Filter by application type' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: "List of available actions" })
  async getAvailableActionsForRole(
    @Param('roleId') roleId: string,
    @Query('applicationTypeId') applicationTypeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.actionesService.getAvailableActionsForRole(
      Number(roleId),
      applicationTypeId ? Number(applicationTypeId) : undefined,
      categoryId ? Number(categoryId) : undefined,
    );
  }

  @Post("roles/:roleId/mappings/bulk")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: "Bulk assign actions to role", 
    description: "Assign multiple actions to a role at once. Skips already-mapped actions and reports errors." 
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['actionIds'],
      properties: {
        actionIds: { 
          type: 'array', 
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'Array of action IDs to assign'
        },
        applicationTypeId: { type: 'number', description: 'Optional application type ID' },
        categoryId: { type: 'number', description: 'Optional category ID' },
      }
    }
  })
  @ApiResponse({ status: 200, description: "Bulk assignment result" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async bulkAssignActions(
    @Param('roleId') roleId: string,
    @Body() body: { actionIds: number[]; applicationTypeId?: number; categoryId?: number }
  ) {
    return this.actionesService.bulkAssignActionsToRole(
      Number(roleId), body.actionIds,
      body.applicationTypeId, body.categoryId
    );
  }

  @Delete("roles/:roleId/mappings/:actionId")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: "Remove action from role", 
    description: "Remove an action mapping from a role (soft delete)" 
  })
  @ApiQuery({ name: 'applicationTypeId', required: false, type: Number, description: 'Filter by application type' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: "Mapping removed" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async removeActionFromRole(
    @Param('roleId') roleId: string,
    @Param('actionId') actionId: string,
    @Query('applicationTypeId') applicationTypeId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    await this.actionesService.removeActionFromRole(
      Number(roleId), Number(actionId),
      applicationTypeId ? Number(applicationTypeId) : undefined,
      categoryId ? Number(categoryId) : undefined,
    );
    return { message: 'Mapping removed successfully' };
  }

  @Get("roles/overview")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: "Get roles with action counts", 
    description: "Get all roles with the count of mapped actions and users" 
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by role name or code' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: "Roles with action counts" })
  async getRolesOverview(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.actionesService.getRolesWithActionCounts({
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }
}
