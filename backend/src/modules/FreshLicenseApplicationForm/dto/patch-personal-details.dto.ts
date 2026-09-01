import { PartialType } from '@nestjs/swagger';
import { CreatePersonalDetailsDto } from './create-personal-details.dto';

export class PatchPersonalDetailsDto extends PartialType(CreatePersonalDetailsDto) {}
