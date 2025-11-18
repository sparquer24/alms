import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsersDto {
 @ApiProperty({ example: 'XYZ', description: 'Username of applicant' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ example: 'xyz@gmail.com', description: 'Email of applicant' })
  @IsNotEmpty()
  @IsString()
  email !: string;

    @ApiProperty({ example: 'password', description: 'Password for the user account' })
    @IsNotEmpty()
    @IsString()
    password!: string;

    @ApiProperty({ example: '9876543210', description: 'Phone number of applicant' })
    @IsOptional()
    @IsString()
    phoneNo!: string;  

    @ApiProperty({ example: 1, description: 'Role ID assigned to the user' })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    roleId!: number;

    @ApiProperty({ example: 1, description: 'Police Station ID associated with the user' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    policeStationId!: number;

    @ApiProperty({ example: 1, description: 'State ID associated with the user' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    stateId!: number;  

    @ApiProperty({ example: 1, description: 'District ID associated with the user' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    districtId!: number;  

    @ApiProperty({ example: 1, description: 'Zone ID associated with the user' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    zoneId!: number;  

    @ApiProperty({ example: 1, description: 'Division ID associated with the user' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    divisionId!: number;

}
    