import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SexEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum WeaponCategoryEnum {
  RESTRICTED = 'RESTRICTED',
  PERMISSIBLE = 'PERMISSIBLE'
}

export enum LicensePurposeEnum {
  SELF_PROTECTION = 'SELF_PROTECTION',
  SPORTS = 'SPORTS',
  HEIRLOOM_POLICY = 'HEIRLOOM_POLICY'
}

export enum FileTypeEnum {
  AADHAR_CARD = 'AADHAR_CARD',
  PAN_CARD = 'PAN_CARD',
  TRAINING_CERTIFICATE = 'TRAINING_CERTIFICATE',
  OTHER_STATE_LICENSE = 'OTHER_STATE_LICENSE',
  EXISTING_LICENSE = 'EXISTING_LICENSE',
  SAFE_CUSTODY = 'SAFE_CUSTODY',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  OTHER = 'OTHER'
}

export class AddressDto {
  @ApiProperty({ 
    description: 'Address line',
    example: '123 Main Street, Jubilee Hills'
  })
  @IsString()
  @IsNotEmpty()
  addressLine!: string;

  @ApiProperty({ 
    description: 'State ID',
    example: 1
  })
  @IsNumber()
  stateId!: number;

  @ApiProperty({ 
    description: 'District ID',
    example: 1
  })
  @IsNumber()
  districtId!: number;

  @ApiProperty({ 
    description: 'Since residing date',
    example: '2015-06-01T00:00:00.000Z'
  })
  @IsDateString()
  sinceResiding!: string;
}

export class ContactInfoDto {
  @ApiPropertyOptional({ 
    description: 'Office telephone number',
    example: '040-12345678'
  })
  @IsOptional()
  @IsString()
  telephoneOffice?: string;

  @ApiPropertyOptional({ 
    description: 'Residence telephone number',
    example: '040-87654321'
  })
  @IsOptional()
  @IsString()
  telephoneResidence?: string;

  @ApiProperty({ 
    description: 'Mobile number',
    example: '9876543210'
  })
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string;

  @ApiPropertyOptional({ 
    description: 'Office mobile number',
    example: '9876543211'
  })
  @IsOptional()
  @IsString()
  officeMobileNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Alternative mobile number',
    example: '9876543212'
  })
  @IsOptional()
  @IsString()
  alternativeMobile?: string;
}

export class OccupationInfoDto {
  @ApiProperty({ 
    description: 'Occupation',
    example: 'Software Engineer'
  })
  @IsString()
  @IsNotEmpty()
  occupation!: string;

  @ApiProperty({ 
    description: 'Office address',
    example: '456 Tech Park, Hitech City'
  })
  @IsString()
  @IsNotEmpty()
  officeAddress!: string;

  @ApiProperty({ 
    description: 'State ID',
    example: 1
  })
  @IsNumber()
  stateId!: number;

  @ApiProperty({ 
    description: 'District ID',
    example: 1
  })
  @IsNumber()
  districtId!: number;

  @ApiPropertyOptional({ 
    description: 'Crop location',
    example: 'N/A'
  })
  @IsOptional()
  @IsString()
  cropLocation?: string;

  @ApiPropertyOptional({ 
    description: 'Area under cultivation',
    example: 0
  })
  @IsOptional()
  @IsNumber()
  areaUnderCultivation?: number;
}

export class BiometricDataDto {
  @ApiPropertyOptional({ 
    description: 'Signature image URL (base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })
  @IsOptional()
  @IsString()
  signatureImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Iris scan image URL (base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })
  @IsOptional()
  @IsString()
  irisScanImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Photo image URL (base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })
  @IsOptional()
  @IsString()
  photoImageUrl?: string;
}

export class CriminalHistoryDto {
  @ApiProperty({ 
    description: 'Whether convicted',
    example: false
  })
    @IsBoolean()
    convicted: boolean = false;

  @ApiProperty({ 
    description: 'Is criminal case pending',
    example: 'No'
  })
  @IsString()
  @IsNotEmpty()
  isCriminalCasePending!: string;

  @ApiPropertyOptional({ 
    description: 'FIR number',
    example: ''
  })
  @IsOptional()
  @IsString()
  firNumber?: string;

  @ApiPropertyOptional({ 
    description: 'Police station',
    example: ''
  })
  @IsOptional()
  @IsString()
  policeStation?: string;

  @ApiPropertyOptional({ 
    description: 'Section of law',
    example: ''
  })
  @IsOptional()
  @IsString()
  sectionOfLaw?: string;

  @ApiPropertyOptional({ 
    description: 'Date of offence',
    example: ''
  })
  @IsOptional()
  @IsString()
  dateOfOffence?: string;

  @ApiPropertyOptional({ 
    description: 'Case status',
    example: ''
  })
  @IsOptional()
  @IsString()
  caseStatus?: string;
}

export class LicenseHistoryDto {
  @ApiProperty({ 
    description: 'Has applied before',
    example: false
  })
    @IsBoolean()
    hasAppliedBefore: boolean = false;

  @ApiProperty({ 
    description: 'Has other applications',
    example: false
  })
    @IsBoolean()
    hasOtherApplications: boolean = false;

  @ApiProperty({ 
    description: 'Family member has arms license',
    example: false
  })
    @IsBoolean()
    familyMemberHasArmsLicense: boolean = false;

  @ApiProperty({ 
    description: 'Has safe place for arms',
    example: true
  })
    @IsBoolean()
    hasSafePlaceForArms: boolean = false;

  @ApiProperty({ 
    description: 'Has undergone training',
    example: false
  })
    @IsBoolean()
    hasUndergoneTraining: boolean = false;

  @ApiProperty({ 
    description: 'Has previous license',
    example: 'no'
  })
  @IsString()
  @IsNotEmpty()
  hasPreviousLicense!: string;

  @ApiPropertyOptional({ 
    description: 'Previous license number',
    example: ''
  })
  @IsOptional()
  @IsString()
  previousLicenseNumber?: string;

  @ApiPropertyOptional({ 
    description: 'License issue date',
    example: ''
  })
  @IsOptional()
  @IsString()
  licenseIssueDate?: string;

  @ApiPropertyOptional({ 
    description: 'License expiry date',
    example: ''
  })
  @IsOptional()
  @IsString()
  licenseExpiryDate?: string;

  @ApiPropertyOptional({ 
    description: 'Issuing authority',
    example: ''
  })
  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @ApiProperty({ 
    description: 'Is license renewed',
    example: 'No'
  })
  @IsString()
  @IsNotEmpty()
  isLicenseRenewed!: string;

  @ApiPropertyOptional({ 
    description: 'Renewal date',
    example: ''
  })
  @IsOptional()
  @IsString()
  renewalDate?: string;

  @ApiPropertyOptional({ 
    description: 'Renewing authority',
    example: ''
  })
  @IsOptional()
  @IsString()
  renewingAuthority?: string;
}

export class LicenseRequestDetailsDto {
  @ApiProperty({ 
    description: 'Need for license',
    enum: LicensePurposeEnum,
    example: LicensePurposeEnum.SELF_PROTECTION,
    enumName: 'LicensePurposeEnum'
  })
  @IsEnum(LicensePurposeEnum)
  @IsNotEmpty()
  needForLicense!: LicensePurposeEnum;

  @ApiProperty({ 
    description: 'Weapon category', 
    enum: WeaponCategoryEnum,
    example: WeaponCategoryEnum.PERMISSIBLE,
    enumName: 'WeaponCategoryEnum'
  })
  @IsEnum(WeaponCategoryEnum)
  weaponCategory: WeaponCategoryEnum = WeaponCategoryEnum.PERMISSIBLE;

  @ApiProperty({ 
    description: 'Requested weapon IDs', 
    type: [String],
    example: ['1']
  })
  @IsArray()
  @IsString({ each: true })
  requestedWeaponIds: string[] = [];

  @ApiProperty({ 
    description: 'Area of validity',
    example: 'Hyderabad'
  })
  @IsString()
  @IsNotEmpty()
  areaOfValidity!: string;
}

export class FileUploadDto {
  @ApiProperty({ 
    description: 'File name',
    example: 'pan_card_test.png'
  })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ 
    description: 'File size in bytes',
    example: 60
  })
  @IsNumber()
  fileSize!: number;

  @ApiProperty({ 
    description: 'File type', 
    enum: FileTypeEnum,
    example: FileTypeEnum.PAN_CARD,
    enumName: 'FileTypeEnum'
  })
  @IsEnum(FileTypeEnum)
  fileType: FileTypeEnum = FileTypeEnum.PAN_CARD;

  @ApiProperty({ 
    description: 'File URL (base64 encoded)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII='
  })
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}

export class CreateApplicationDto {
  @ApiProperty({ 
    description: 'First name',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiPropertyOptional({ 
    description: 'Middle name',
    example: 'Kumar'
  })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ 
    description: 'Last name',
    example: 'Singh'
  })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ 
    description: 'Filled by',
    example: 'Self'
  })
  @IsString()
  @IsNotEmpty()
  filledBy!: string;

  @ApiProperty({ 
    description: 'Parent or spouse name',
    example: 'Rajesh Kumar'
  })
  @IsString()
  @IsNotEmpty()
  parentOrSpouseName!: string;

  @ApiProperty({ 
    description: 'Sex', 
    enum: SexEnum,
    example: SexEnum.MALE,
    enumName: 'SexEnum'
  })
  @IsEnum(SexEnum)
  sex: SexEnum = SexEnum.MALE;

  @ApiProperty({ 
    description: 'Place of birth',
    example: 'Hyderabad'
  })
  @IsString()
  @IsNotEmpty()
  placeOfBirth!: string;

  @ApiProperty({ 
    description: 'Date of birth',
    example: '1990-01-15T00:00:00.000Z'
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ 
    description: 'PAN number',
    example: 'ABCDE1234F'
  })
  @IsString()
  @IsNotEmpty()
  panNumber!: string;

  @ApiProperty({ 
    description: 'Aadhar number',
    example: '123456789012'
  })
  @IsString()
  @IsNotEmpty()
  aadharNumber!: string;

  @ApiProperty({ 
    description: 'Date of birth in words',
    example: 'Fifteenth January Nineteen Ninety'
  })
  @IsString()
  @IsNotEmpty()
  dobInWords!: string;

  @ApiProperty({ 
    description: 'State ID',
    example: 1
  })
  @IsNumber()
  stateId!: number;

  @ApiProperty({ 
    description: 'District ID',
    example: 1
  })
  @IsNumber()
  districtId!: number;

  @ApiProperty({ 
    description: 'Current user ID',
    example: 13
  })
  @IsNumber()
  currentUserId!: number;

  @ApiProperty({ 
    description: 'Current role ID',
    example: 34
  })
  @IsNumber()
  currentRoleId!: number;

  @ApiProperty({ 
    description: 'Present address', 
    type: AddressDto,
    example: {
      addressLine: "123 Main Street, Jubilee Hills",
      stateId: 1,
      districtId: 1,
      sinceResiding: "2015-06-01T00:00:00.000Z"
    }
  })
  @ValidateNested()
  @Type(() => AddressDto)
  presentAddress!: AddressDto;

  @ApiProperty({ 
    description: 'Permanent address', 
    type: AddressDto,
    example: {
      addressLine: "123 Main Street, Jubilee Hills",
      stateId: 1,
      districtId: 1,
      sinceResiding: "2015-06-01T00:00:00.000Z"
    }
  })
  @ValidateNested()
  @Type(() => AddressDto)
  permanentAddress!: AddressDto;

  @ApiProperty({ 
    description: 'Contact information', 
    type: ContactInfoDto,
    example: {
      telephoneOffice: "040-12345678",
      telephoneResidence: "040-87654321",
      mobileNumber: "9876543210",
      officeMobileNumber: "9876543211",
      alternativeMobile: "9876543212"
    }
  })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo!: ContactInfoDto;

  @ApiProperty({ 
    description: 'Occupation information', 
    type: OccupationInfoDto,
    example: {
      occupation: "Software Engineer",
      officeAddress: "456 Tech Park, Hitech City",
      stateId: 1,
      districtId: 1,
      cropLocation: "N/A",
      areaUnderCultivation: 0
    }
  })
  @ValidateNested()
  @Type(() => OccupationInfoDto)
  occupationInfo!: OccupationInfoDto;

  @ApiPropertyOptional({ 
    description: 'Biometric data', 
    type: BiometricDataDto,
    example: {
      signatureImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      irisScanImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      photoImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BiometricDataDto)
  biometricData?: BiometricDataDto;

  @ApiProperty({ 
    description: 'Criminal history', 
    type: [CriminalHistoryDto],
    example: [{
      convicted: false,
      isCriminalCasePending: "No",
      firNumber: "",
      policeStation: "",
      sectionOfLaw: "",
      dateOfOffence: "",
      caseStatus: ""
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriminalHistoryDto)
  criminalHistory!: CriminalHistoryDto[];

  @ApiProperty({ 
    description: 'License history', 
    type: [LicenseHistoryDto],
    example: [{
      hasAppliedBefore: false,
      hasOtherApplications: false,
      familyMemberHasArmsLicense: false,
      hasSafePlaceForArms: true,
      hasUndergoneTraining: false,
      hasPreviousLicense: "no",
      previousLicenseNumber: "",
      licenseIssueDate: "",
      licenseExpiryDate: "",
      issuingAuthority: "",
      isLicenseRenewed: "No",
      renewalDate: "",
      renewingAuthority: ""
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LicenseHistoryDto)
  licenseHistory!: LicenseHistoryDto[];

  @ApiProperty({ 
    description: 'License request details', 
    type: LicenseRequestDetailsDto,
    example: {
      needForLicense: "SELF_PROTECTION",
      weaponCategory: "PERMISSIBLE",
      requestedWeaponIds: ["1"],
      areaOfValidity: "Hyderabad"
    }
  })
  @ValidateNested()
  @Type(() => LicenseRequestDetailsDto)
  licenseRequestDetails!: LicenseRequestDetailsDto;

  @ApiProperty({ 
    description: 'File uploads', 
    type: [FileUploadDto],
    example: [{
      fileName: "pan_card_test.png",
      fileSize: 60,
      fileType: "PAN_CARD",
      fileUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII="
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  fileUploads!: FileUploadDto[];
}
