import { IsInt, IsArray, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFlowMappingDto {
    @ApiProperty({
        description: 'Current role ID',
        example: 1,
    })
    @IsInt()
    currentRoleId!: number;

    @ApiProperty({
        description: 'Array of next role IDs',
        example: [2, 3],
        isArray: true,
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    nextRoleIds!: number[];

    @ApiPropertyOptional({ description: 'Application type ID', example: 1 })
    @IsOptional()
    @IsInt()
    applicationTypeId?: number;

    @ApiPropertyOptional({ description: 'Category ID', example: 1 })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({ description: 'Workflow ID', example: 1 })
    @IsOptional()
    @IsInt()
    workflowId?: number;
}

export class UpdateFlowMappingDto {
    @ApiProperty({
        description: 'Array of next role IDs',
        example: [2, 3],
        isArray: true,
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    nextRoleIds!: number[];

    @ApiPropertyOptional({ description: 'User ID of the person updating the mapping' })
    @IsOptional()
    @IsInt()
    updatedBy?: number;

    @ApiPropertyOptional({ description: 'Application type ID', example: 1 })
    @IsOptional()
    @IsInt()
    applicationTypeId?: number;

    @ApiPropertyOptional({ description: 'Category ID', example: 1 })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({ description: 'Workflow ID', example: 1 })
    @IsOptional()
    @IsInt()
    workflowId?: number;
}

export class ValidateFlowMappingDto {
    @ApiProperty({
        description: 'Current role ID',
        example: 1,
    })
    @IsInt()
    currentRoleId!: number;

    @ApiProperty({
        description: 'Array of next role IDs to validate',
        example: [2, 3],
        isArray: true,
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    nextRoleIds!: number[];

    @ApiPropertyOptional({ description: 'Application type ID', example: 1 })
    @IsOptional()
    @IsInt()
    applicationTypeId?: number;

    @ApiPropertyOptional({ description: 'Category ID', example: 1 })
    @IsOptional()
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({ description: 'Workflow ID', example: 1 })
    @IsOptional()
    @IsInt()
    workflowId?: number;
}
