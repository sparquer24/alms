import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponse {
  @ApiProperty({ description: 'Success status', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Response message', example: 'Operation completed successfully' })
  message!: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: any;

  @ApiProperty({ description: 'Total count for list responses', required: false })
  count?: number;
}

export class ApiErrorResponse {
  @ApiProperty({ description: 'Error status', example: false })
  success!: boolean;

  @ApiProperty({ description: 'Error message', example: 'An error occurred' })
  message!: string;

  @ApiProperty({ description: 'Detailed error information', required: false })
  error?: string;
}

export class LocationDto {
  @ApiProperty({ description: 'Location ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Location name', example: 'West Bengal' })
  name!: string;

  @ApiProperty({ description: 'Location code', example: 'WB', required: false })
  code?: string;
}

export class StateDto {
  @ApiProperty({ description: 'State ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'State name', example: 'West Bengal' })
  name!: string;

  @ApiProperty({ description: 'State code', example: 'WB' })
  code!: string;
}

export class DistrictDto extends LocationDto {
  @ApiProperty({ description: 'State ID this district belongs to', example: 1 })
  stateId!: number;
}

export class ZoneDto extends LocationDto {
  @ApiProperty({ description: 'District ID this zone belongs to', example: 1 })
  districtId!: number;
}

export class DivisionDto extends LocationDto {
  @ApiProperty({ description: 'Zone ID this division belongs to', example: 1 })
  zoneId!: number;
}

export class PoliceStationDto extends LocationDto {
  @ApiProperty({ description: 'Division ID this police station belongs to', example: 1 })
  divisionId!: number;
}

export class UserDto {
  @ApiProperty({ description: 'User ID', example: '1' })
  id!: string;

  @ApiProperty({ description: 'Username', example: 'dcp_user' })
  username!: string;

  @ApiProperty({ description: 'User email', example: 'dcp@example.com', required: false })
  email?: string;

  @ApiProperty({ description: 'User role', example: 'DCP', required: false })
  role?: string;
}

export class CreateUserDto {
  @ApiProperty({ description: 'Username', example: 'new_user' })
  username!: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email!: string;

  @ApiProperty({ description: 'Password', example: 'securePassword123' })
  password!: string;

  @ApiProperty({ 
    description: 'User role', 
    example: 'DCP',
    enum: ['APPLICANT', 'SHO', 'ZS', 'ACP', 'DCP', 'CP', 'ADMIN', 'SUPER_ADMIN', 'ARMS_SUPDT']
  })
  role!: string;
}

export class AttachmentDto {
  @ApiProperty({ description: 'Attachment name', example: 'document.pdf' })
  name!: string;

  @ApiProperty({ description: 'Attachment type', example: 'DOCUMENT' })
  type!: string;

  @ApiProperty({ description: 'Content type', example: 'application/pdf' })
  contentType!: string;

  @ApiProperty({ description: 'File URL', example: 'https://example.com/files/document.pdf' })
  url!: string;
}

export class WorkflowActionDto {
  @ApiProperty({ description: 'Application ID', example: 123 })
  applicationId!: number;

  @ApiProperty({ description: 'Action ID from Actiones table', example: 1 })
  actionId!: number;

  @ApiProperty({ description: 'Next user ID for forwarding', example: 456, required: false })
  nextUserId?: number;

  @ApiProperty({ description: 'Action remarks', example: 'Forwarding for review' })
  remarks!: string;

  @ApiProperty({ 
    description: 'Attachments for the action', 
    type: [AttachmentDto], 
    required: false 
  })
  attachments?: AttachmentDto[];
}

export class ApplicationSummaryDto {
  @ApiProperty({ description: 'Application ID', example: 'app_123' })
  id!: string;

  @ApiProperty({ description: 'Application number', example: 'ALMS2025001' })
  applicationNumber!: string;

  @ApiProperty({ description: 'Application status', example: 'SUBMITTED' })
  status!: string;

  @ApiProperty({ description: 'Applicant name', example: 'John Doe' })
  applicantName!: string;

  @ApiProperty({ description: 'Creation date', example: '2025-08-20T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Related tables/relations', example: ['personalInfo', 'address'] })
  relations!: string[];
}

export class LocationHierarchyDto {
  @ApiProperty({ description: 'State information', type: StateDto, required: false })
  state?: StateDto;

  @ApiProperty({ description: 'District information', type: DistrictDto, required: false })
  district?: DistrictDto;

  @ApiProperty({ description: 'Zone information', type: ZoneDto, required: false })
  zone?: ZoneDto;

  @ApiProperty({ description: 'Division information', type: DivisionDto, required: false })
  division?: DivisionDto;

  @ApiProperty({ description: 'Police station information', type: PoliceStationDto, required: false })
  policeStation?: PoliceStationDto;
}
