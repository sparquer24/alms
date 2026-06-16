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
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'All categories retrieved' })
  async getAll(@Query('activeOnly') activeOnly?: string) {
    const result = await this.service.findAll(activeOnly === 'true');
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.findById(id);
    return { success: true, data: result };
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.service.create(dto);
    return { success: true, message: 'Category created', data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.service.update(id, dto);
    return { success: true, message: 'Category updated', data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { success: true, message: 'Category deleted' };
  }
}
