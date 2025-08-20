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
    @Body() body: ForwardDto & { actionId?: number; attachments?: Array<{ name: string; type: string; contentType: string; url: string }> },
    @Req() req: Request
  ) {
    // Log the incoming body at the very start for debugging
    console.log('Incoming body:', body);

    // Extract user info from JWT
    const user = (req as any).user;
    const roleId = user?.role_id;
    if (!user || user.user_id === undefined || user.user_id === null || roleId === undefined || roleId === null) {
      throw new ForbiddenException('Invalid user credentials.');
    }

    // Validate required fields (DTO will handle most, but double-check for nextUserId if forwarding)
    if (body.actionId === undefined || body.actionId === null || isNaN(Number(body.actionId))) {
      throw new BadRequestException('Missing or invalid required actionId field.');
    }
    if (body.applicationId === undefined || body.applicationId === null || isNaN(Number(body.applicationId))) {
      throw new BadRequestException('Missing or invalid required applicationId field.');
    }
    if (!body.remarks) {
      throw new BadRequestException('Missing required remarks fields.');
    }

    // All action logic is now based on actionId and Actiones table

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

    // Dynamically validate actionId against Actiones table
    const actionRepo = this.workflowService['prisma'].actiones;
    const action = await actionRepo.findFirst({
      where: { id: Number(body.actionId), isActive: true }
    });
    if (!action) {
      throw new BadRequestException('Invalid actionId: not found in Actiones table.');
    }

    // Example: If you want to check for a specific action, compare by action.id
    // if (action.id === FORWARD_ACTION_ID && !body.nextUserId) { ... }
    // For now, keep the forward check by code for compatibility
    if (action.code.toLowerCase() === 'forward' && (body.nextUserId === undefined || body.nextUserId === null || isNaN(Number(body.nextUserId)))) {
      throw new BadRequestException('nextUserId is required for forwarding and must be a valid number.');
    }

    // ...existing code...

    // Call service to process action
    try {
      const result = await this.workflowService.handleUserAction({
        ...body,
        applicationId: Number(body.applicationId),
        actionId: Number(action.id),
        action, // pass the full action object if needed for downstream logic
        currentUserId: Number(user.user_id),
        nextUserId: body.nextUserId !== undefined && body.nextUserId !== null ? Number(body.nextUserId) : undefined,
        attachments: body.attachments || [],
      });
      return {
        success: true,
        message: `${action.code.toLowerCase()} performed successfully.`,
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
