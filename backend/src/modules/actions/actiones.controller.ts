import { Controller, Get, Post, Request, UseGuards, Body, Patch } from "@nestjs/common";
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
    status: 201,
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

}

