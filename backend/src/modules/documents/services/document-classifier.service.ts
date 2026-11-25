import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { detectFileType } from '../../../utils/file-signature.util';
import {
  DOCUMENT_TYPES,
  normalizeDocumentTypeKey,
  isOcrClassificationEnabled,
} from '../config/document-types.config';
import {
  DocumentValidationResponseDto,
  DocumentValidationStatus,
} from '../dto/validate-document.dto';

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

@Injectable()
export class DocumentClassifierService {
  private readonly logger = new Logger(DocumentClassifierService.name);

  /**
   * Validate an uploaded document buffer against the expected document type.
   */
  async validateDocument(
    buffer: Buffer,
    expectedDocumentType: string,
    originalFilename?: string,
  ): Promise<DocumentValidationResponseDto> {
    const canonicalExpectedKey = normalizeDocumentTypeKey(expectedDocumentType);

    if (!canonicalExpectedKey) {
      return {
        success: false,
        status: DocumentValidationStatus.INVALID_FILE,
        expectedType: expectedDocumentType,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: `Unsupported or unknown expected document type: ${expectedDocumentType}`,
      };
    }

    // 1. Magic byte / MIME type validation via file-type / signatures
    let detectedMime: string | undefined;
    let detectedExt: string | undefined;

    try {
      const typeResult = await detectFileType(buffer);
      if (typeResult) {
        detectedMime = typeResult.mime;
        detectedExt = typeResult.ext;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to inspect file magic bytes: ${err.message}`);
    }

    // Fallback detection for PDF if magic bytes are slightly offset
    if (!detectedMime && buffer.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
      detectedMime = 'application/pdf';
      detectedExt = 'pdf';
    }

    if (!detectedMime || !SUPPORTED_MIME_TYPES.includes(detectedMime)) {
      return {
        success: false,
        status: DocumentValidationStatus.INVALID_FILE,
        expectedType: canonicalExpectedKey,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: `Invalid or unsupported file format (${detectedMime || 'unknown'}). Allowed formats: PDF, JPEG, PNG, WebP.`,
      };
    }

    // 2. OCR and Document Classification restriction:
    // Only Aadhaar Card and PAN Card undergo OCR extraction and classification.
    // All other documents bypass OCR completely.
    if (!isOcrClassificationEnabled(canonicalExpectedKey)) {
      return {
        success: true,
        status: DocumentValidationStatus.DOCUMENT_ACCEPTED,
        expectedType: canonicalExpectedKey,
        detectedType: canonicalExpectedKey,
        confidence: 1.0,
        message: 'Document accepted without OCR validation.',
      };
    }

    // 3. Text Extraction (PDF parser or Tesseract OCR)
    let extractedText = '';

    try {
      if (detectedMime === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData?.text || '';
      } else {
        // Image preprocessing with sharp to enhance OCR clarity
        let processedBuffer = buffer;
        try {
          processedBuffer = await sharp(buffer)
            .grayscale()
            .normalize()
            .toBuffer();
        } catch (sharpError: any) {
          this.logger.warn(`Sharp image preprocessing warning: ${sharpError.message}`);
          processedBuffer = buffer;
        }

        const ocrResult = await Tesseract.recognize(processedBuffer, 'eng', {
          logger: () => {}, // suppress verbose progress logs
        });
        extractedText = ocrResult?.data?.text || '';
      }
    } catch (extractError: any) {
      this.logger.error(`Error during text extraction: ${extractError.message}`);
      return {
        success: false,
        status: DocumentValidationStatus.UNREADABLE,
        expectedType: canonicalExpectedKey,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: 'Could not extract text from document. File may be corrupted, password-protected, or unreadable.',
      };
    }

    const cleanedText = extractedText.replace(/\s+/g, ' ').trim();
    if (cleanedText.length < 10) {
      return {
        success: false,
        status: DocumentValidationStatus.UNREADABLE,
        expectedType: canonicalExpectedKey,
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: 'Uploaded document contains insufficient readable text or is a blank scan.',
      };
    }

    // 3. Document Classification (Keyword & Pattern matching)
    // Note: Extracted text is NOT logged to protect PII
    const lowerText = cleanedText.toLowerCase();

    type MatchResult = {
      key: string;
      score: number;
    };

    const scores: MatchResult[] = [];

    for (const [key, def] of Object.entries(DOCUMENT_TYPES)) {
      if (!isOcrClassificationEnabled(key)) {
        continue;
      }
      let score = 0;

      // Keyword matching (up to 0.45 weight)
      if (def.keywords && def.keywords.length > 0) {
        let matchedCount = 0;
        for (const kw of def.keywords) {
          if (lowerText.includes(kw.toLowerCase())) {
            matchedCount++;
          }
        }
        const keywordFraction = Math.min(matchedCount / Math.min(def.keywords.length, 5), 1);
        score += keywordFraction * 0.45;
      }

      // Pattern matching (up to 0.55 weight)
      if (def.requiredPatterns && def.requiredPatterns.length > 0) {
        let patternMatched = false;
        for (const pattern of def.requiredPatterns) {
          if (pattern.test(cleanedText)) {
            patternMatched = true;
            break;
          }
        }
        if (patternMatched) {
          score += 0.55;
        }
      }

      // Exclusive pattern penalty
      if (def.exclusivePatterns && def.exclusivePatterns.length > 0) {
        for (const pattern of def.exclusivePatterns) {
          if (pattern.test(cleanedText)) {
            score -= 0.4;
            break;
          }
        }
      }

      scores.push({ key, score: Math.max(0, Math.min(1, score)) });
    }

    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];

    const detectedType = bestMatch && bestMatch.score >= 0.35 ? bestMatch.key : 'UNKNOWN';
    const rawConfidence = bestMatch ? bestMatch.score : 0;
    const confidence = Math.round(rawConfidence * 100) / 100;

    const expectedConfig = DOCUMENT_TYPES[canonicalExpectedKey];
    const threshold = expectedConfig?.minConfidence ?? 0.6;

    let status: DocumentValidationStatus;
    let success = false;
    let message = '';

    if (detectedType === 'UNKNOWN' || confidence < 0.35) {
      status = DocumentValidationStatus.REVIEW_REQUIRED;
      success = false;
      message = `Document identification confidence is insufficient (${confidence}). Please ensure document is clearly readable.`;
    } else if (detectedType === canonicalExpectedKey) {
      if (confidence >= threshold) {
        status = DocumentValidationStatus.DOCUMENT_ACCEPTED;
        success = true;
        message = `Document matches expected type ${DOCUMENT_TYPES[canonicalExpectedKey]?.label || canonicalExpectedKey} with confidence ${confidence}.`;
      } else {
        status = DocumentValidationStatus.REVIEW_REQUIRED;
        success = false;
        message = `Document matches ${DOCUMENT_TYPES[canonicalExpectedKey]?.label || canonicalExpectedKey} but confidence (${confidence}) is below acceptance threshold (${threshold}).`;
      }
    } else {
      status = DocumentValidationStatus.DOCUMENT_MISMATCH;
      success = false;
      const detectedLabel = DOCUMENT_TYPES[detectedType]?.label || detectedType;
      const expectedLabel = DOCUMENT_TYPES[canonicalExpectedKey]?.label || canonicalExpectedKey;
      message = `Document mismatch: Expected ${expectedLabel} but detected ${detectedLabel}.`;
    }

    // PII-safe logging (no Aadhaar / PAN numbers logged)
    this.logger.log(
      `Classification result: expected=${canonicalExpectedKey}, detected=${detectedType}, confidence=${confidence}, status=${status}`,
    );

    return {
      success,
      status,
      expectedType: canonicalExpectedKey,
      detectedType,
      confidence,
      message,
    };
  }

  /**
   * Save an accepted document buffer to permanent storage under uploads/accepted/<TYPE>/
   */
  async saveAcceptedDocument(
    buffer: Buffer,
    originalFilename: string,
    docType: string,
  ): Promise<string> {
    const canonicalKey = normalizeDocumentTypeKey(docType) || 'OTHER';
    const targetDir = path.resolve(process.cwd(), 'uploads', 'accepted', canonicalKey);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(originalFilename || '') || '.pdf';
    const filename = `${randomUUID()}${ext}`;
    const fullPath = path.join(targetDir, filename);

    await fs.promises.writeFile(fullPath, buffer);

    const relativePath = `uploads/accepted/${canonicalKey}/${filename}`;
    return relativePath;
  }
}
