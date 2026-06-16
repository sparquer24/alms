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
import { ApplicationTypeService } from './application-type.service';
import {
  CreateApplicationTypeDto,
  UpdateApplicationTypeDto,
} from './dto/application-type.dto';

@ApiTags('Application Type')
@Controller('application-types')
export class ApplicationTypeController {
  constructor(private readonly service: ApplicationTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all application types' })
  @ApiResponse({ status: 200, description: 'All application types retrieved' })
  async getAll(@Query('activeOnly') activeOnly?: string) {
    const result = await this.service.findAll(activeOnly === 'true');
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application type by ID' })
  @ApiResponse({ status: 200, description: 'Application type found' })
  @ApiResponse({ status: 404, description: 'Application type not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: 'Create application type' })
  @ApiBody({ type: CreateApplicationTypeDto })
  @ApiResponse({ status: 201, description: 'Application type created' })
  async create(@Body() dto: CreateApplicationTypeDto) {
    const result = await this.service.create(dto);
    return { success: true, message: 'Application type created', data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update application type' })
  @ApiBody({ type: UpdateApplicationTypeDto })
  @ApiResponse({ status: 200, description: 'Application type updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationTypeDto,
  ) {
    const result = await this.service.update(id, dto);
    return { success: true, message: 'Application type updated', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application type' })
  @ApiResponse({ status: 200, description: 'Application type deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true, message: 'Application type deleted' };
  }
}
