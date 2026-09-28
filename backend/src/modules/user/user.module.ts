import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
