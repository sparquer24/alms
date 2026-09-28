import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

/**
 * A single row from a parsed CSV/XLSX import file.
 *
 * Cells are validated field-by-field in LicensesService (see the
 * IMPORT_FIELD_ALIASES map) so the payload stays intentionally loose here:
 * spreadsheet values arrive as strings, numbers or dates depending on the
 * reader, and both human-readable names ("Hyderabad") and raw ids ("579") are
 * accepted for the address hierarchy columns.
 */
export type LicenseImportRow = Record<string, unknown>;

export class PreviewLicenseImportDto {
  @ApiProperty({
    description: 'Parsed import rows, one object per spreadsheet row',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one row is required' })
  rows!: LicenseImportRow[];

  @ApiPropertyOptional({
    description: 'When true, rows that only carry warnings are blocked from import instead of imported',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  strict?: boolean;
}

export class CommitLicenseImportDto extends PreviewLicenseImportDto {
  @ApiPropertyOptional({ description: 'Original file name, recorded on the batch audit trail' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'How to treat rows whose license number already exists',
    enum: ['fail', 'skip'],
    default: 'fail',
  })
  @IsOptional()
  @IsIn(['fail', 'skip'])
  onDuplicate?: 'fail' | 'skip';
}
