import {Module} from '@nestjs/common';  
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
// Update the path below to the correct location of prisma.service.ts


@Module({
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}    