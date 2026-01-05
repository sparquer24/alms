import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/**
 * Public Module
 * Handles public-facing endpoints that don't require authentication
 * Used for QR code scanning and public application verification
 */
@Module({
    controllers: [PublicController],
    providers: [PublicService],
    exports: [PublicService],
})
export class PublicModule { }
