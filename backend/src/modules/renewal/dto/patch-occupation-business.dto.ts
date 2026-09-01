import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatchRenewalOccupationBusinessDto {
  @ApiProperty({ example: 'Farmer', description: 'Occupation' })
  @IsNotEmpty()
  @IsString()
  occupation!: string;

  @ApiProperty({ example: '123 Market Street', description: 'Office address' })
  @IsNotEmpty()
  @IsString()
  officeAddress!: string;

  @ApiProperty({ example: 1, description: 'State ID' })
  @IsNotEmpty()
  @IsNumber()
  stateId!: number;

  @ApiProperty({ example: 1, description: 'District ID' })
  @IsNotEmpty()
  @IsNumber()
  districtId!: number;

  @ApiPropertyOptional({ example: 'Plot 123, Village XYZ', description: 'Crop location' })
  @IsOptional()
  @IsString()
  cropLocation?: string;

  @ApiPropertyOptional({ example: 10.5, description: 'Area under cultivation in acres' })
  @IsOptional()
  @IsNumber()
  areaUnderCultivation?: number;
}
