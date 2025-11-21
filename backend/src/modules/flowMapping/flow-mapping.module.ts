import { Module } from '@nestjs/common';
import { FlowMappingController } from './flow-mapping.controller';
import { FlowMappingService } from './flow-mapping.service';

@Module({
    controllers: [FlowMappingController],
    providers: [FlowMappingService],
    exports: [FlowMappingService],
})
export class FlowMappingModule { }
