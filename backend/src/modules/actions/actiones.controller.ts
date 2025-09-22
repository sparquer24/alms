import { Controller, Get, Query, ParseIntPipe } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { Actiones } from "@prisma/client";

@ApiTags("Actiones")
@Controller("actiones")
export class ActionesController {
  constructor(private readonly actionesService: ActionesService) {}

  @Get()
  @ApiOperation({
    summary: "Get actions",
    description: "Retrieve actions. If userId is provided, returns only actions allowed for that user's role.",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    description: "Filter actions by user id",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Actions retrieved successfully",
    // type: [Actiones],
  })
  async getActiones(
    @Query("userId", ParseIntPipe) userId?: number, // 👈 ensures number
  ): Promise<Actiones[]> {
    return this.actionesService.getActiones(userId);
  }
}
