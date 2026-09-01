import {Module} from '@nestjs/common';  
import { ActionesController } from './actiones.controller';
import { ActionesService } from './actiones.service';
// Update the path below to the correct location of prisma.service.ts

@Module({
  controllers: [ActionesController],
  providers: [ActionesService],
})
export class ActionesModule {}