import { Global, Module } from '@nestjs/common';
import prisma from '../db/prismaClient';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class PrismaModule {}
