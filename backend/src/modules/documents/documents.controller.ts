import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { DocumentsService } from './documents.service';
import { GetDocumentsDto } from './dto/get-documents.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get documents for an application',
    description:
      'Retrieve all uploaded documents for a given application by its ID or acknowledgement number, and type (Fresh, Renewal, or Cancellation). Returns an array of document metadata sorted by upload date (newest first).',
  })
  @ApiQuery({
    name: 'id',
    required: false,
    type: Number,
    description: 'Application ID (numeric). Provide either id or applicationNumber.',
    example: 123,
  })
  @ApiQuery({
    name: 'applicationNumber',
    required: false,
    type: String,
    description:
      'Application acknowledgement number (e.g. FALS..., RAF..., CAF...). Provide either id or applicationNumber.',
    example: 'FALS1696050000000',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['Fresh', 'Renewal', 'Cancellation'],
    description: 'Application type',
    example: 'Fresh',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Documents retrieved successfully',
        data: [
          {
            id: 1,
            applicationId: 123,
            applicationType: 'Fresh',
            fileType: 'AADHAR_CARD',
            fileName: 'aadhar_card.pdf',
            fileUrl: 'https://example.com/uploads/aadhar_card.pdf',
            fileSize: 2048576,
            uploadedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid or missing parameters',
    schema: {
      example: {
        success: false,
        error: 'Either application ID or application number is required',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Application not found',
    schema: {
      example: {
        success: false,
        error: 'Application with ID 999 not found in Fresh applications',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getDocuments(
    @Query() query: GetDocumentsDto,
  ) {
    try {
      const { id, applicationNumber, type } = query;

      // Resolve application ID: either from the id param directly,
      // or by looking up the acknowledgement number
      let applicationId: number;

      if (id !== undefined) {
        applicationId = id;
      } else if (applicationNumber) {
        applicationId = await this.documentsService.resolveApplicationNumber(
          applicationNumber,
          type,
        );
      } else {
        // This should be caught by DTO validation, but guard defensively
        throw new HttpException(
          {
            success: false,
            error: 'Either application ID or application number is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const documents = await this.documentsService.getDocuments(applicationId, type);

      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: documents,
      };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }

      this.logger.error(
        `Failed to retrieve documents: ${err.message}`,
        err.stack,
      );

      throw new HttpException(
        {
          success: false,
          error: err?.message || 'Failed to retrieve documents',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
