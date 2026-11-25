import { Module } from '@nestjs/common';
import { BiometricController } from './biometric.controller';
import { BiometricService } from './biometric.service';
import { BiometricEncryptionService } from './biometric-encryption.service';
import { BiometricAuditService } from './biometric-audit.service';
import { BiometricPhotoService } from './services/biometric-photo.service';

@Module({
    controllers: [BiometricController],
    providers: [
        BiometricService,
        BiometricEncryptionService,
        BiometricAuditService,
        BiometricPhotoService,
    ],
    exports: [
        BiometricService,
        BiometricEncryptionService,
        BiometricAuditService,
        BiometricPhotoService,
    ],
})
export class BiometricModule { }
