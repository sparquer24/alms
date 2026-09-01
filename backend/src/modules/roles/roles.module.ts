import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { PublicRolesController } from './public-roles.controller';
import { RolesService } from './roles.service';

@Module({
    controllers: [RolesController, PublicRolesController],
    providers: [RolesService],
})
export class RolesModule { }