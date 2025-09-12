import {Module} from '@nestjs/common';  
import { WeaponsController } from './weapons.controller';
import { WeaponsService } from './weapons.service';
// Update the path below to the correct location of prisma.service.ts

@Module({
  controllers: [WeaponsController],
  providers: [WeaponsService],
})
export class WeaponsModule {}