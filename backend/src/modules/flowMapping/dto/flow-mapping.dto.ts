import { IsInt, IsArray, IsOptional, ArrayMinSize, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleFlowApplicationType } from '@prisma/client';

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

    @IsOptional()
    @IsString()
    applicationType?: RoleFlowApplicationType;

    @IsOptional()
    @IsInt()
    stateId?: number | null;

    @IsOptional()
    @IsInt()
    districtId?: number | null;
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

    @ApiProperty({
        description: 'User ID of the person updating the mapping',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    updatedBy?: number;

    @IsOptional()
    @IsString()
    applicationType?: RoleFlowApplicationType;

    @IsOptional()
    @IsInt()
    stateId?: number | null;

    @IsOptional()
    @IsInt()
    districtId?: number | null;
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

    @IsOptional()
    @IsString()
    applicationType?: RoleFlowApplicationType;

    @IsOptional()
    @IsInt()
    stateId?: number | null;

    @IsOptional()
    @IsInt()
    districtId?: number | null;
}
