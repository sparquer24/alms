import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatchOccupationBusinessDto {
  @ApiProperty({ example: 'Software Engineer', description: 'Occupation of the applicant' })
  @IsNotEmpty()
  @IsString()
  occupation!: string;

  @ApiProperty({ example: '456 Corporate Plaza, IT Park', description: 'Office address' })
  @IsNotEmpty()
  @IsString()
  officeAddress!: string;

  @ApiProperty({ example: 1, description: 'State ID where office is located' })
  @IsNotEmpty()
  @IsNumber()
  stateId!: number;

  @ApiProperty({ example: 1, description: 'District ID where office is located' })
  @IsNotEmpty()
  @IsNumber()
  districtId!: number;

  @ApiPropertyOptional({ example: 'Village ABC, Block XYZ', description: 'Crop location (if applicable)' })
  @IsOptional()
  @IsString()
  cropLocation?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Area under cultivation in acres (if applicable)' })
  @IsOptional()
  @IsNumber()
  areaUnderCultivation?: number;
}