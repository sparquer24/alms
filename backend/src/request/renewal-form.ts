import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenewalFormResponse {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional()
  acknowledgementNo?: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiProperty()
  licenseId!: number;

  @ApiProperty()
  applicantName!: string;

  @ApiProperty()
  parentOrSpouseName!: string;

  @ApiProperty()
  sex!: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  dobInWords?: string;

  @ApiPropertyOptional()
  panNumber?: string;

  @ApiPropertyOptional()
  aadharNumber?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  isSubmit?: boolean;

  @ApiPropertyOptional()
  renewalLicenseId?: string;

  @ApiPropertyOptional()
  isApproved?: boolean;

  @ApiPropertyOptional()
  isPending?: boolean;

  @ApiPropertyOptional()
  isRejected?: boolean;

  @ApiPropertyOptional()
  workflowStatusId?: number;

  @ApiPropertyOptional()
  currentUserId?: number;

  @ApiPropertyOptional()
  previousUserId?: number;

  @ApiPropertyOptional()
  presentAddressId?: number;

  @ApiPropertyOptional()
  permanentAddressId?: number;

  @ApiPropertyOptional()
  occupationAndBusinessId?: number;

  @ApiPropertyOptional()
  isDeclarationAccepted?: boolean;

  @ApiPropertyOptional()
  isAwareOfLegalConsequences?: boolean;

  @ApiPropertyOptional()
  isTermsAccepted?: boolean;

  // Nested relations
  @ApiPropertyOptional()
  workflowStatus?: any;

  @ApiPropertyOptional()
  currentUser?: any;

  @ApiPropertyOptional()
  previousUser?: any;

  @ApiPropertyOptional()
  presentAddress?: any;

  @ApiPropertyOptional()
  permanentAddress?: any;

  @ApiPropertyOptional()
  occupationAndBusiness?: any;

  @ApiPropertyOptional()
  licenseDetails?: any[];

  @ApiPropertyOptional()
  fileUploads?: any[];

  @ApiPropertyOptional()
  biometricData?: any;

  @ApiPropertyOptional()
  workflowHistories?: any[];
}

