import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

describe('VerificationController', () => {
  let controller: VerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [{ provide: VerificationService, useValue: {} }],
    }).compile();

    controller = module.get<VerificationController>(VerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
