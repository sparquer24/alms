import { Test, TestingModule } from '@nestjs/testing';
import { HearingsService } from './hearings.service';

describe('HearingsService', () => {
  let service: HearingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HearingsService],
    }).compile();

    service = module.get<HearingsService>(HearingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
