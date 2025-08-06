import { Controller, Post, Body, UseGuards, Req, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { ForwardDto } from './dto/forward.dto';
import { WorkflowService } from './workflow.service';
import { Request } from 'express';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}
  @UseGuards(JwtAuthGuard)
  @Post('action')
  async handleAction(
    @Body() body: ForwardDto,
    @Req() req: Request
  ) {
    // Extract user info from JWT
    const user = (req as any).user;
    if (!user || !user.user_id || !user.role_id) {
      throw new ForbiddenException('Invalid user credentials.');
    }

    // Validate required fields (DTO will handle most, but double-check for nextUserId if forwarding)
    if (!body.actionType ){
        throw new BadRequestException('Missing required actionType fields.');
    }
    if (!body.applicationId){
        throw new BadRequestException('Missing required applicationId fields.');
    }
    if(!body.remarks) {
      throw new BadRequestException('Missing required remarks fields.');
    }
    if (body.actionType === 'forward' && !body.nextUserId) {
      throw new BadRequestException('nextUserId is required for forwarding.');
    }

    // Call service to process action
    try {
      const result = await this.workflowService.handleUserAction({
        ...body,
        currentUserId: user.user_id,
        currentRoleId: user.role_id,
      });
      return {
        success: true,
        message: 'forwarded performed successfully.',
        updatedApplication: result,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Unexpected error occurred.');
    }
  }
}
