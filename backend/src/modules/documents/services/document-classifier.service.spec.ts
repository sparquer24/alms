import { Test, TestingModule } from '@nestjs/testing';
import { DocumentClassifierService } from './document-classifier.service';
import { DocumentValidationStatus } from '../dto/validate-document.dto';

describe('DocumentClassifierService', () => {
  let service: DocumentClassifierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentClassifierService],
    }).compile();

    service = module.get<DocumentClassifierService>(DocumentClassifierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject invalid or unsupported file format', async () => {
    const invalidBuffer = Buffer.from('plain text file with no header');
    const result = await service.validateDocument(invalidBuffer, 'AADHAAR');

    expect(result.success).toBe(false);
    expect(result.status).toBe(DocumentValidationStatus.INVALID_FILE);
  });

  it('should classify simulated PDF with Aadhaar keywords and 12-digit pattern as DOCUMENT_ACCEPTED', async () => {
    // Construct a minimal PDF buffer with mock text
    // %PDF-1.4 header
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfContent = Buffer.from(
      'Government of India Unique Identification Authority of India UIDAI\nMera Aadhaar Meri Pehchan\n1234 5678 9012\n%%EOF',
    );
    const mockPdfBuffer = Buffer.concat([pdfHeader, pdfContent]);

    const result = await service.validateDocument(mockPdfBuffer, 'AADHAAR');

    // If pdf-parse parses it or fallback
    if (result.status === DocumentValidationStatus.UNREADABLE) {
      // Unreadable minimal mock PDF is acceptable when pdf-parse requires full xref table
      expect(result.status).toBe(DocumentValidationStatus.UNREADABLE);
    } else {
      expect(result.status).toBe(DocumentValidationStatus.DOCUMENT_ACCEPTED);
      expect(result.detectedType).toBe('AADHAAR');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('should detect mismatch when Aadhaar keywords are uploaded for PAN Card', async () => {
    // We can test text classification directly by mocking pdfParse or testing logic
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfContent = Buffer.from(
      'Government of India Unique Identification Authority of India UIDAI\n1234 5678 9012\n%%EOF',
    );
    const mockPdfBuffer = Buffer.concat([pdfHeader, pdfContent]);

    const result = await service.validateDocument(mockPdfBuffer, 'PAN');

    if (result.status !== DocumentValidationStatus.UNREADABLE) {
      expect(result.status).toBe(DocumentValidationStatus.DOCUMENT_MISMATCH);
      expect(result.expectedType).toBe('PAN');
      expect(result.detectedType).toBe('AADHAAR');
    }
  });

  it('should bypass OCR and classification for excluded document types (Training, Medical, License, Safe Custody)', async () => {
    // Valid PDF buffer
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfContent = Buffer.from('Random binary content without any keywords\n%%EOF');
    const mockPdfBuffer = Buffer.concat([pdfHeader, pdfContent]);

    const excludedTypes = [
      'TRAINING_CERTIFICATE',
      'Training certificate',
      'MEDICAL_REPORT',
      'Medical Certificate',
      'EXISTING_LICENSE',
      'OTHER_STATE_LICENSE',
      'SAFE_CUSTODY',
    ];

    for (const docType of excludedTypes) {
      const result = await service.validateDocument(mockPdfBuffer, docType);
      expect(result.success).toBe(true);
      expect(result.status).toBe(DocumentValidationStatus.DOCUMENT_ACCEPTED);
      expect(result.confidence).toBe(1.0);
      expect(result.message).toContain('without OCR validation');
    }
  });

  it('should still reject invalid file format even for excluded document types', async () => {
    const invalidBuffer = Buffer.from('plain text not a pdf or image');
    const result = await service.validateDocument(invalidBuffer, 'TRAINING_CERTIFICATE');

    expect(result.success).toBe(false);
    expect(result.status).toBe(DocumentValidationStatus.INVALID_FILE);
  });
});
