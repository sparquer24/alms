import { Test, TestingModule } from '@nestjs/testing';
import { HearingsController } from './hearings.controller';

describe('HearingsController', () => {
  let controller: HearingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HearingsController],
    }).compile();

    controller = module.get<HearingsController>(HearingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
