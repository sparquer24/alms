import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WorkflowMasterService } from './workflow-master.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow-master.dto';

@ApiTags('Workflow Master')
@Controller('workflows-master')
export class WorkflowMasterController {
  constructor(private readonly service: WorkflowMasterService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({ status: 200, description: 'All workflows retrieved' })
  async getAll(@Query('activeOnly') activeOnly?: string) {
    const result = await this.service.findAll(activeOnly === 'true');
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({ status: 200, description: 'Workflow found' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({ status: 201, description: 'Workflow created' })
  async create(@Body() dto: CreateWorkflowDto) {
    const result = await this.service.create(dto);
    return { success: true, message: 'Workflow created', data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiBody({ type: UpdateWorkflowDto })
  @ApiResponse({ status: 200, description: 'Workflow updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkflowDto,
  ) {
    const result = await this.service.update(id, dto);
    return { success: true, message: 'Workflow updated', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true, message: 'Workflow deleted' };
  }
}
