import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '../../middleware/auth.middleware';
import { MulterFile } from '../../types/multer-file.type';
import { DocumentsService } from './documents.service';
import { GetDocumentsDto } from './dto/get-documents.dto';
import { DocumentClassifierService } from './services/document-classifier.service';
import {
  DocumentValidationResponseDto,
  DocumentValidationStatus,
  ValidateDocumentDto,
} from './dto/validate-document.dto';
import { DOCUMENT_TYPES } from './config/document-types.config';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentClassifierService: DocumentClassifierService,
  ) {}

  /**
   * List supported document types
   */
  @Get('supported-types')
  @ApiOperation({
    summary: 'List supported document types',
    description: 'Returns all document type keys, human-readable labels, and minimum confidence thresholds.',
  })
  @ApiResponse({
    status: 200,
    description: 'Supported document types retrieved successfully',
  })
  getSupportedTypes() {
    const types = Object.values(DOCUMENT_TYPES).map((def) => ({
      key: def.key,
      label: def.label,
      minConfidence: def.minConfidence,
    }));
    return {
      success: true,
      data: types,
    };
  }

  /**
   * Validate a document without permanently storing it (Dry-run)
   */
  @Post('validate')
  @ApiOperation({
    summary: 'Validate an uploaded document against expected document type',
    description:
      'Inspects actual file content using OCR, PDF extraction, and pattern matching. Returns classification status.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document', 'expectedDocumentType'],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file to validate (PDF, JPEG, PNG, WebP)',
        },
        expectedDocumentType: {
          type: 'string',
          description: 'Expected document category (e.g. AADHAAR, PAN)',
          example: 'AADHAAR',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document accepted or review required',
    type: DocumentValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or missing parameters',
  })
  @ApiResponse({
    status: 422,
    description: 'Document mismatch or unreadable document',
  })
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async validateDocument(
    @UploadedFile() file: MulterFile,
    @Body() body: ValidateDocumentDto,
  ): Promise<DocumentValidationResponseDto> {
    if (!file || !file.buffer) {
      throw new HttpException(
        {
          success: false,
          status: DocumentValidationStatus.INVALID_FILE,
          expectedType: body?.expectedDocumentType || 'UNKNOWN',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: 'Document file is required in "document" field.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const expectedType = body?.expectedDocumentType;
    if (!expectedType) {
      throw new HttpException(
        {
          success: false,
          status: DocumentValidationStatus.INVALID_FILE,
          expectedType: 'UNKNOWN',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: 'Field "expectedDocumentType" is required.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.documentClassifierService.validateDocument(
      file.buffer,
      expectedType,
      file.originalname,
    );

    if (result.status === DocumentValidationStatus.DOCUMENT_MISMATCH) {
      throw new HttpException(result, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (result.status === DocumentValidationStatus.UNREADABLE) {
      throw new HttpException(result, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (result.status === DocumentValidationStatus.INVALID_FILE) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  /**
   * Validate and permanently store an accepted document
   */
  @Post('upload')
  @ApiOperation({
    summary: 'Validate and store an accepted document',
    description:
      'Validates uploaded document against expected type. If accepted, saves file permanently under uploads/accepted/<TYPE>/ and returns file path.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document', 'expectedDocumentType'],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file to validate and save',
        },
        expectedDocumentType: {
          type: 'string',
          description: 'Expected document category',
          example: 'PAN',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document validated and saved successfully',
    type: DocumentValidationResponseDto,
  })
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadAndValidateDocument(
    @UploadedFile() file: MulterFile,
    @Body() body: ValidateDocumentDto,
  ): Promise<DocumentValidationResponseDto> {
    if (!file || !file.buffer) {
      throw new HttpException(
        {
          success: false,
          status: DocumentValidationStatus.INVALID_FILE,
          expectedType: body?.expectedDocumentType || 'UNKNOWN',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: 'Document file is required in "document" field.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const expectedType = body?.expectedDocumentType;
    if (!expectedType) {
      throw new HttpException(
        {
          success: false,
          status: DocumentValidationStatus.INVALID_FILE,
          expectedType: 'UNKNOWN',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: 'Field "expectedDocumentType" is required.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const validation = await this.documentClassifierService.validateDocument(
      file.buffer,
      expectedType,
      file.originalname,
    );

    if (validation.status === DocumentValidationStatus.DOCUMENT_MISMATCH) {
      throw new HttpException(validation, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (validation.status === DocumentValidationStatus.UNREADABLE) {
      throw new HttpException(validation, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (validation.status === DocumentValidationStatus.INVALID_FILE) {
      throw new HttpException(validation, HttpStatus.BAD_REQUEST);
    }

    // Save accepted file
    const savedPath = await this.documentClassifierService.saveAcceptedDocument(
      file.buffer,
      file.originalname,
      validation.expectedType,
    );

    return {
      ...validation,
      filePath: savedPath,
    };
  }

  /**
   * Existing endpoint: Retrieve documents for an application
   */
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
  async getDocuments(
    @Query() query: GetDocumentsDto,
  ) {
    try {
      const { id, applicationNumber, type } = query;

      let applicationId: number;

      if (id !== undefined) {
        applicationId = id;
      } else if (applicationNumber) {
        applicationId = await this.documentsService.resolveApplicationNumber(
          applicationNumber,
          type,
        );
      } else {
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
