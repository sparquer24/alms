import { Controller, Get, Post, Request, UseGuards, Body, Param, Put, Delete, Query } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { RolesActionsMapping, Actiones } from "@prisma/client";
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';

@ApiTags("Actiones")
@ApiBearerAuth('JWT-auth')
@Controller("actiones")
export class ActionesController {
  constructor(private readonly actionesService: ActionesService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get actions",
    description: "Retrieve actions for the authenticated user (based on token). Optionally filter based on application status.",
  })
  @ApiQuery({
    name: 'applicationId',
    required: false,
    type: Number,
    description: 'Optional applicationId to filter actions based on application status (excludes APPROVED action if already approved, REJECT action if already rejected)'
  })
  @ApiQuery({
    name: 'applicationType',
    required: false,
    type: String,
    description: 'Optional application type to filter actions (e.g., "Fresh" or "Renewal)'
  })
  @ApiResponse({ status: 200, description: "Actions retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getActiones(
    @Request() req: any,
    @Query('applicationId') applicationId?: string,
    @Query('applicationType') applicationType?: string
  ): Promise<Actiones[]> {
    // JwtAuthGuard guarantees request.user is set to decoded token if valid
    const tokenUserId = req.user && (req.user as any).sub ? Number((req.user as any).sub) : undefined;

    return this.actionesService.getActiones(
      tokenUserId,
      applicationId ? Number(applicationId) : undefined, applicationType ? String(applicationType) : undefined
    );
  }

  @Get("all")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get all actions",
    description: "Retrieve all available actions in the system for admin usage",
  })
  @ApiResponse({ status: 200, description: "All actions retrieved successfully" })
  async getAllActions(): Promise<Actiones[]> {
    return this.actionesService.getAllActions();
  }

  @Get("RolesActionsMapping")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get all action mappings",
    description: "Retrieve all roles to actions mappings, optionally filtered by roleId and/or applicationType",
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: Number,
    description: 'Filter mappings by role ID'
  })
  @ApiQuery({
    name: 'applicationType',
    required: false,
    type: String,
    description: 'Filter mappings by application type (ALL, FRESH, RENEWAL, CANCEL)'
  })
  @ApiResponse({ status: 200, description: "Action mappings retrieved successfully" })
  async getAllActionMappings(
    @Query('roleId') roleId?: string,
    @Query('applicationType') applicationType?: string
  ) {
    return this.actionesService.getAllActionMappings(
      roleId ? Number(roleId) : undefined,
      applicationType ? String(applicationType) : undefined
   );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Create a new Action",
    description: "Create a new action in the Actiones table",
  })
  @ApiBody({
    description: "Action creation data",
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'NEW_ACTION' },
        name: { type: 'string', example: 'New Action' },
        description: { type: 'string', example: 'A newly created action' },
        isActive: { type: 'boolean', example: true },
      },
      required: ['code', 'name'],
    }
  })
  @ApiResponse({ status: 201, description: "Action created successfully" })
  async createNewAction(@Body() actionData: { code: string; name: string; description?: string; isActive?: boolean }) {
    try {
      return await this.actionesService.createNewAction(actionData);
    } catch (error) {
      throw error;
    }
  }

  @Post("RolesActionsMapping")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Create action",
    description: "Create a new action entry",
  })
  @ApiBody({
    description: "Action creation data",
    examples: {
      "New Action": {
        summary: "A new action entry",
        value: {
          roleId: 1,
          actionId: 1,
          isActive: true,
          createdAt: new Date(),
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Action created successfully",
  })
  async createAction(@Body() mappingData: RolesActionsMapping, @Request() req: any) {
    try {
      const userId = req.user && (req.user as any).sub ? Number((req.user as any).sub) : undefined;
      return this.actionesService.createAction(mappingData, userId);
    }
    catch (error) {
      throw error;
    }
  }

  @Put("RolesActionsMapping/:id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Update action",
    description: "Update an existing action entry",
  })
  @ApiBody({
    description: "Action update data",
    examples: {
      "Update Action": {
        summary: "An existing action entry",
        value: {
          roleId: 1,
          actionId: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Action updated successfully",
  })
  async updateAction(@Param('id') id: number, @Body() mappingData: RolesActionsMapping, @Request() req: any) {
    try {
      const userId = req.user && (req.user as any).sub ? Number((req.user as any).sub) : undefined;
      return this.actionesService.updateAction(Number(id), mappingData, userId);
    } catch (error) {
      throw error;
    }
  }
  @Delete("RolesActionsMapping/:id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Delete action mapping",
    description: "Delete an existing action mapping entry",
  })
  @ApiBody({
    description: "Action mapping ID to delete",
    examples: {
      "Delete Action Mapping": {
        summary: "An existing action mapping entry ID",
        value: {
          isactive: false,
          updatedAt: new Date(),
          deletedAt: new Date(),
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: "Action mapping deleted successfully (soft delete)",
  })
  async deleteActionMapping(@Param('id') id: number) {
    try {
      return this.actionesService.deleteActionMapping(Number(id));
    } catch (error) {
      throw error;
    }
  }

}

