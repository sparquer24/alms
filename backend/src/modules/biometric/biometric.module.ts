import { Module } from '@nestjs/common';
import { BiometricController } from './biometric.controller';
import { BiometricService } from './biometric.service';
import { BiometricEncryptionService } from './biometric-encryption.service';
import { BiometricAuditService } from './biometric-audit.service';

@Module({
    controllers: [BiometricController],
    providers: [BiometricService, BiometricEncryptionService, BiometricAuditService],
    exports: [BiometricService, BiometricEncryptionService, BiometricAuditService],
})
export class BiometricModule { }
