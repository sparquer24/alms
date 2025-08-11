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
    @Body() body: ForwardDto & { attachments?: Array<{ name: string; type: string; contentType: string; url: string }> },
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

    // Validate attachments if present
    if (body.attachments) {
      if (!Array.isArray(body.attachments)) {
        throw new BadRequestException('Attachments must be an array.');
      }
      for (const att of body.attachments) {
        if (!att.name || !att.type || !att.contentType || !att.url) {
          throw new BadRequestException('Each attachment must have name, type, contentType, and url.');
        }
      }
    }

    // Dynamically validate actionType against Actiones table
    const statusRepo = this.workflowService['prisma'].actiones;
    const statusExists = await statusRepo.findFirst({
      where: { code: body.actionType.toUpperCase(), isActive: true }
    });
    if (!statusExists) {
      throw new BadRequestException('Invalid action type: not found in Actiones table.');
    }

    // Call service to process action
    try {
      const result = await this.workflowService.handleUserAction({
        ...body,
        currentUserId: user.user_id,
        attachments: body.attachments || [],
      });
      return {
        success: true,
        message: 'forwarded performed successfully.',
        updatedApplication: result,
      };
    } catch (error) {
      console.error('Workflow Action Error:', error);
      if (error instanceof ForbiddenException) throw error;
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Unexpected error occurred.');
    }
  }
}
