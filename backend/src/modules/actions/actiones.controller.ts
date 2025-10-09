import { Controller, Get, Post, Request, UseGuards, Body, Param, Patch, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { RolesActionsMapping } from "@prisma/client";
import { Actiones } from "@prisma/client";
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { create } from "domain";

@ApiTags("Actiones")
@ApiBearerAuth('JWT-auth')
@Controller("actiones")
export class ActionesController {
  constructor(private readonly actionesService: ActionesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get actions",
    description: "Retrieve actions for the authenticated user (based on token).",
  })
  @ApiResponse({ status: 200, description: "Actions retrieved successfully" })
  async getActiones(@Request() req: any): Promise<Actiones[]> {
    // JwtAuthGuard guarantees request.user is set to decoded token if valid
    const tokenUserId = req.user && (req.user as any).sub ? (req.user as any).sub : undefined;

    return this.actionesService.getActiones(tokenUserId as number | undefined);
  }

  @Post("RolesActionsMapping")
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
  async createAction(@Body() mappingData: RolesActionsMapping) {
    try{
      return this.actionesService.createAction(mappingData);
    }
    catch(error){
      throw error;
    } 
  }

  @Patch("RolesActionsMapping/:id")
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
  async updateAction(@Param('id') id : number, @Body() mappingData: RolesActionsMapping ) {
   try {
      return this.actionesService.updateAction(Number(id) ,mappingData);
    } catch (error) {
      throw error;
    }
 }
  @Delete("RolesActionsMapping/:id")
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

