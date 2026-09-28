import { Module } from '@nestjs/common';
import { FlowMappingController } from './flow-mapping.controller';
import { FlowMappingService } from './flow-mapping.service';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [LocationsModule],
    controllers: [FlowMappingController],
    providers: [FlowMappingService],
    exports: [FlowMappingService],
})
export class FlowMappingModule { }
