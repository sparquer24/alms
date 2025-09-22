import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { Actiones } from "@prisma/client";
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';

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
}
