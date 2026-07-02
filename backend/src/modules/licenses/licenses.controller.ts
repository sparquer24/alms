import { Controller, Post, Param, Body } from '@nestjs/common';
import { LicensesService } from './licenses.service';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('generate/:applicationId')
  async generateLicense(
    @Param('applicationId') applicationId: string,
    @Body('issuedBy') issuedBy: string | number
  ) {
    return this.licensesService.generateLicensePdf(Number(applicationId), Number(issuedBy));
  }
}
