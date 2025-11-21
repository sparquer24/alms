import { Module } from '@nestjs/common';
import { FlowMappingController } from './flow-mapping.controller';
import { FlowMappingService } from './flow-mapping.service';
import { PrismaService } from '@/db/prisma.service';

@Module({
    controllers: [FlowMappingController],
    providers: [FlowMappingService, PrismaService],
    exports: [FlowMappingService],
})
export class FlowMappingModule { }
