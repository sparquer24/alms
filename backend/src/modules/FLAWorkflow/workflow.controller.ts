import { Controller, Post, Body, UseGuards, Req, ForbiddenException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard';
import { ForwardDto } from './dto/forward.dto';
import { WorkflowService } from './workflow.service';
import { Request } from 'express';

@ApiTags('Workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('action')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Handle Workflow Action', 
    description: 'Process workflow actions like forward, approve, reject, etc. on applications' 
  })
  @ApiBody({
    description: 'Workflow action data - Same payload structure for all actions',
    schema: {
      type: 'object',
      required: ['applicationId', 'actionId', 'remarks'],
      properties: {
        applicationId: {
          type: 'number',
          description: 'ID of the application to perform action on',
          example: 1
        },
        actionId: {
          type: 'number',
          description: 'ID of the action to perform (from Actiones table)',
          example: 1
        },
        nextUserId: {
          type: 'number',
          description: 'ID of the user to forward to (required only for forward action)',
          example: 4,
          nullable: true
        },
        remarks: {
          type: 'string',
          description: 'Comments or notes for this action',
          example: 'Application reviewed and processing'
        },
        attachments: {
          type: 'array',
          description: 'Optional attachments for this action',
          items: {
            type: 'object',
            required: ['name', 'type', 'contentType', 'url'],
            properties: {
              name: {
                type: 'string',
                example: 'verification_report.pdf'
              },
              type: {
                type: 'string',
                example: 'DOCUMENT'
              },
              contentType: {
                type: 'string',
                example: 'application/pdf'
              },
              url: {
                type: 'string',
                example: 'https://example.com/files/verification_report.pdf'
              }
            }
          }
        }
      }
    },
    examples: {
      'Standard Action Payload': {
        summary: 'Standard payload for any workflow action',
        description: 'Use this payload structure for all actions. Only nextUserId is required when actionId is for "forward" action.',
        value: {
          applicationId: 1,
          actionId: 1,
          nextUserId: 5,
          remarks: 'Application reviewed and processing',
          attachments: [
            {
              name: 'verification_report.pdf',
              type: 'DOCUMENT',
              contentType: 'application/pdf',
              url: 'https://example.com/files/verification_report.pdf'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Action performed successfully',
    example: {
      success: true,
      message: 'forward performed successfully.',
      updatedApplication: {
        id: 123,
        status: 'FORWARDED',
        currentUserId: 456,
        updatedAt: '2025-08-20T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid action data or missing required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this action' })
  @ApiResponse({ status: 404, description: 'Not found - Application or action not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async handleAction(
    @Body() body: ForwardDto & { actionId?: number; attachments?: Array<{ name: string; type: string; contentType: string; url: string }> },
    @Req() req: Request
  ) {
    // Log the incoming body at the very start for debugging
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
