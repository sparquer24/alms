import { Module } from '@nestjs/common';
import { QRCodeController } from './qrcode.controller';
import { QRCodeService } from './qrcode.service';

/**
 * QR Code Module
 * Handles QR code generation for applications
 * Restricted to ZS role users only
 */
@Module({
    controllers: [QRCodeController],
    providers: [QRCodeService],
    exports: [QRCodeService],
})
export class QRCodeModule { }
