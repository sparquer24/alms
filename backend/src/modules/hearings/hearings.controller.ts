import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { HearingsService } from './hearings.service';

@Controller('hearings')
export class HearingsController {
  constructor(private readonly hearingsService: HearingsService) {}

  @Post('schedule')
  async scheduleHearing(@Body() data: any) {
    return this.hearingsService.scheduleHearing(data);
  }

  @Get('application/:applicationId')
  async getHearings(@Param('applicationId') applicationId: string) {
    return this.hearingsService.getHearings(Number(applicationId));
  }

  @Put(':id')
  async updateHearing(@Param('id') id: string, @Body() data: any) {
    return this.hearingsService.updateHearing(Number(id), data);
  }
}
