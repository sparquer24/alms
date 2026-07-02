import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('sho-report/:applicationId')
  async submitSHOReport(@Param('applicationId') applicationId: string, @Body() data: any) {
    return this.verificationService.submitSHOReport(Number(applicationId), data.officerId, data);
  }

  @Get('reports/:applicationId')
  async getReports(@Param('applicationId') applicationId: string) {
    return this.verificationService.getReports(Number(applicationId));
  }

  @Post('acp-review/:applicationId')
  async acpReview(@Param('applicationId') applicationId: string, @Body() data: any) {
    return this.verificationService.acpReview(Number(applicationId), data.reviewerId, data.action, data.remarks);
  }
}
