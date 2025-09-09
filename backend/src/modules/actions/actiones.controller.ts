import { Controller, Get, Param,  Query } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiQuery, ApiResponse }from "@nestjs/swagger";
import { ActionesService } from "./actiones.service";
import { Actiones } from "@prisma/client";

@ApiTags("Actiones")
@Controller("actiones")
export class ActionesController {
  constructor(private readonly actionesService: ActionesService) {}

  @Get()
  @ApiOperation({
  summary: "Get all actions", 
  description: "Retrieve all action entries" })

  @ApiQuery({
    name: 'id',
    required: false,
    description: 'Filter by action id',
    example: 0
  })

  @ApiResponse({
    status: 200,
    description: "Actions retrieved successfully"

  })
  async getActiones(@Query('id') id: number): Promise<Actiones[]> {
    try{
        return this.actionesService.getActiones(id);
    } 
    catch (error) {
      throw error;
    }
  }
}
