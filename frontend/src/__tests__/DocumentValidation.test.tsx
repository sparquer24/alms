import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentValidationBadge } from '../components/forms/elements/DocumentValidationBadge';
import { DocumentValidationService } from '../services/documentValidationService';
import DocumentsSection from '../components/forms/renewal/sections/DocumentsSection';
import DocumentsUpload from '../components/forms/freshApplication/DocumentsUpload';
import { FileUploadService } from '../api/fileUploadService';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockImplementation((param) => {
      if (param === 'applicantId' || param === 'id' || param === 'applicationId') return 'app-123';
      return null;
    }),
  }),
}));

jest.mock('../hooks/useApplicationForm', () => ({
  useApplicationForm: () => ({
    applicantId: 'app-123',
    almsLicenseId: 'lic-123',
    isLoading: false,
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
    saveFormData: jest.fn(),
    navigateToNext: jest.fn(),
    loadExistingData: jest.fn(),
  }),
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'APPLICANT' },
    isAuthenticated: true,
    token: 'test-token',
    isLoading: false,
    initialized: true,
  }),
}));

jest.mock('../api/fileUploadService', () => ({
  FileUploadService: {
    uploadFile: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 101, fileName: 'uploaded.pdf' },
    }),
    getFiles: jest.fn().mockResolvedValue([]),
    deleteFile: jest.fn().mockResolvedValue({ success: true }),
  },
}));

if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  window.URL.revokeObjectURL = jest.fn();
}

describe('DocumentValidation', () => {
  describe('DocumentValidationService', () => {
    it('correctly maps display names to expected document types', () => {
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('Aadhar Card')).toBe('AADHAAR');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('idProofUploaded')).toBe('AADHAAR');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('PAN Card')).toBe('PAN');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('panCardUploaded')).toBe('PAN');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('Training certificate')).toBe('TRAINING_CERTIFICATE');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('Medical Certificate')).toBe('MEDICAL_REPORT');
      expect(DocumentValidationService.mapFormDocTypeToExpectedType('Other')).toBe('OTHER');
    });

    it('correctly determines OCR eligibility for Aadhaar and PAN only', () => {
      // Aadhaar and PAN must be OCR eligible
      expect(DocumentValidationService.isOcrEligible('Aadhar Card')).toBe(true);
      expect(DocumentValidationService.isOcrEligible('idProofUploaded')).toBe(true);
      expect(DocumentValidationService.isOcrEligible('AADHAAR')).toBe(true);
      expect(DocumentValidationService.isOcrEligible('PAN Card')).toBe(true);
      expect(DocumentValidationService.isOcrEligible('panCardUploaded')).toBe(true);
      expect(DocumentValidationService.isOcrEligible('PAN')).toBe(true);

      // All other documents must be excluded from OCR and classification
      expect(DocumentValidationService.isOcrEligible('Training certificate')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('trainingCertificateUploaded')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Medical Reports')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Medical Certificate')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('medicalCertificateUploaded')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Other state Arms License')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('otherStateLicenseUploaded')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Existing Arms License')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('existingArmsLicenseUploaded')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Safe custody')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('safeCustodyUploaded')).toBe(false);
      expect(DocumentValidationService.isOcrEligible('Other')).toBe(false);
    });

    it('bypasses network OCR and immediately accepts excluded documents in validateDocument', async () => {
      const dummyFile = new File(['mock content'], 'training.pdf', { type: 'application/pdf' });
      const result = await DocumentValidationService.validateDocument(dummyFile, 'Training certificate');

      expect(result.success).toBe(true);
      expect(result.status).toBe('DOCUMENT_ACCEPTED');
      expect(result.confidence).toBe(1.0);
      expect(result.message).toContain('without OCR validation');
    });
  });

  describe('DocumentValidationBadge Component', () => {
    it('renders validating spinner state', () => {
      render(<DocumentValidationBadge isValidating={true} />);
      expect(screen.getByText(/Validating document content/i)).toBeInTheDocument();
    });

    it('renders DOCUMENT_ACCEPTED status with confidence', () => {
      render(
        <DocumentValidationBadge
          status="DOCUMENT_ACCEPTED"
          detectedType="Aadhaar Card"
          confidence={0.88}
        />,
      );
      expect(screen.getByText(/Document Accepted:/i)).toBeInTheDocument();
      expect(screen.getByText(/Aadhaar Card/i)).toBeInTheDocument();
      expect(screen.getByText(/88%/i)).toBeInTheDocument();
    });

    it('renders DOCUMENT_MISMATCH status with warning', () => {
      render(
        <DocumentValidationBadge
          status="DOCUMENT_MISMATCH"
          expectedType="PAN Card"
          detectedType="Aadhaar Card"
        />,
      );
      expect(screen.getByText(/Document Mismatch/i)).toBeInTheDocument();
      expect(screen.getByText(/Expected PAN Card but detected Aadhaar Card/i)).toBeInTheDocument();
    });

    it('renders REVIEW_REQUIRED status', () => {
      render(
        <DocumentValidationBadge
          status="REVIEW_REQUIRED"
          message="Confidence is low. Please check document clarity."
        />,
      );
      expect(screen.getByText(/Review Required/i)).toBeInTheDocument();
      expect(screen.getByText(/Confidence is low/i)).toBeInTheDocument();
    });

    it('renders UNREADABLE status', () => {
      render(
        <DocumentValidationBadge
          status="UNREADABLE"
          message="Unable to extract text from file."
        />,
      );
      expect(screen.getByText(/Unreadable Document/i)).toBeInTheDocument();
      expect(screen.getByText(/Unable to extract text/i)).toBeInTheDocument();
    });

    it('renders INVALID_FILE status', () => {
      render(
        <DocumentValidationBadge
          status="INVALID_FILE"
          message="Unsupported file format."
        />,
      );
      expect(screen.getByText(/Invalid File/i)).toBeInTheDocument();
      expect(screen.getByText(/Unsupported file format/i)).toBeInTheDocument();
    });
  });

  describe('Renewal DocumentsSection validation error handling and replacement', () => {
    let validateSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      validateSpy?.mockRestore();
    });

    it('displays document mismatch error when incorrect document is uploaded, and clears it immediately when replaced with the correct document', async () => {
      // 1. Initial upload: PAN Card uploaded for Aadhaar Card -> Mismatch
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument')
        .mockResolvedValueOnce({
          success: false,
          status: 'DOCUMENT_MISMATCH',
          expectedType: 'AADHAAR',
          detectedType: 'PAN',
          confidence: 0.9,
          message: 'Document mismatch: Expected Aadhar Card but detected PAN.',
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'DOCUMENT_ACCEPTED',
          expectedType: 'AADHAAR',
          detectedType: 'AADHAAR',
          confidence: 0.95,
          message: 'Document accepted',
        });

      const onErrorMock = jest.fn();
      const onPatchMock = jest.fn();

      const { container } = render(
        <DocumentsSection
          formData={{}}
          renewalId="123"
          onPatch={onPatchMock}
          onError={onErrorMock}
        />,
      );

      // Find the file input for idProofUploaded (Aadhar Card)
      const aadharInput = container.querySelector('input[name="idProofUploaded"]') as HTMLInputElement;
      expect(aadharInput).toBeInTheDocument();

      // Upload incorrect file (PAN Card)
      const wrongFile = new File(['fake-pan-content'], 'pan_card.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [wrongFile] } });

      // Wait for validation to complete and error to be set
      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith('Document mismatch: Expected Aadhar Card but detected PAN.');
      });
      expect(screen.getByText('Document Mismatch')).toBeInTheDocument();
      expect(screen.getByText(/Expected Aadhar Card but detected PAN/i)).toBeInTheDocument();
      expect(onPatchMock).not.toHaveBeenCalled();

      // Clear calls to verify next actions cleanly
      onErrorMock.mockClear();

      // 2. Replace with correct document (Aadhaar Card)
      const correctFile = new File(['fake-aadhar-content'], 'aadhar_card.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [correctFile] } });

      // The previous error must be cleared immediately when replacement starts (onError(null))
      expect(onErrorMock).toHaveBeenCalledWith(null);

      // Wait for revalidation of the newly uploaded document
      await waitFor(() => {
        expect(screen.getByText(/Document Accepted:/i)).toBeInTheDocument();
      });

      // The previous mismatch error must be removed immediately
      expect(screen.queryByText('Document Mismatch')).not.toBeInTheDocument();
      expect(screen.queryByText(/Expected Aadhar Card but detected PAN/i)).not.toBeInTheDocument();

      // The correct document should be staged
      expect(onPatchMock).toHaveBeenCalledWith(expect.objectContaining({
        idProofUploaded: expect.objectContaining({
          fileName: 'aadhar_card.pdf',
        }),
      }));
    });

    it('clears previous validation errors when deleting a document', async () => {
      const onErrorMock = jest.fn();
      const onPatchMock = jest.fn();

      render(
        <DocumentsSection
          formData={{
            idProofUploaded: {
              pendingFile: new File([''], 'test.pdf'),
              fileName: 'test.pdf',
              fileUrl: 'blob:test',
              fileSize: 100,
            },
          }}
          renewalId="123"
          onPatch={onPatchMock}
          onError={onErrorMock}
        />,
      );

      const removeBtn = screen.getByText('Remove');
      fireEvent.click(removeBtn);

      expect(onErrorMock).toHaveBeenCalledWith(null);
      expect(onPatchMock).toHaveBeenCalledWith({ idProofUploaded: null });
    });

    it('completely bypasses OCR and classification when uploading excluded documents in Renewal Application', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument');

      const onPatchMock = jest.fn();
      const onErrorMock = jest.fn();

      const { container } = render(
        <DocumentsSection
          formData={{}}
          renewalId="ren-123"
          onPatch={onPatchMock}
          onError={onErrorMock}
        />,
      );

      // List of all excluded document fields in Renewal Application
      const excludedFields = [
        { field: 'trainingCertificateUploaded', name: 'training.pdf' },
        { field: 'medicalCertificateUploaded', name: 'medical.pdf' },
        { field: 'otherStateLicenseUploaded', name: 'other_state.pdf' },
        { field: 'existingArmsLicenseUploaded', name: 'existing_license.pdf' },
        { field: 'safeCustodyUploaded', name: 'safe_custody.pdf' },
      ];

      for (const item of excludedFields) {
        const input = container.querySelector(`input[name="${item.field}"]`) as HTMLInputElement;
        expect(input).toBeInTheDocument();

        const file = new File(['valid document content'], item.name, { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });

        // DocumentValidationService.validateDocument must NOT be invoked for excluded documents
        expect(validateSpy).not.toHaveBeenCalled();

        // No validating status or error displayed
        expect(screen.queryByText(/Validating document content/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Document Mismatch/i)).not.toBeInTheDocument();

        // Staged into form state
        expect(onPatchMock).toHaveBeenCalledWith(expect.objectContaining({
          [item.field]: expect.objectContaining({
            fileName: item.name,
          }),
        }));

        onPatchMock.mockClear();
      }
    });

    it('still rejects oversized files (> 3 MB) for excluded documents in Renewal Application', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument');

      const onErrorMock = jest.fn();
      const onPatchMock = jest.fn();

      const { container } = render(
        <DocumentsSection
          formData={{}}
          renewalId="ren-123"
          onPatch={onPatchMock}
          onError={onErrorMock}
        />,
      );

      const medicalInput = container.querySelector('input[name="medicalCertificateUploaded"]') as HTMLInputElement;
      const oversizedFile = new File(['oversized content'], 'medical.pdf', { type: 'application/pdf' });
      Object.defineProperty(oversizedFile, 'size', { value: 3.5 * 1024 * 1024 });

      fireEvent.change(medicalInput, { target: { files: [oversizedFile] } });

      expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('exceeds the maximum allowed size of 3 MB'));
      expect(validateSpy).not.toHaveBeenCalled();
      expect(onPatchMock).not.toHaveBeenCalled();
    });
  });

  describe('Fresher DocumentsUpload OCR restriction and upload workflow', () => {
    let validateSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      validateSpy?.mockRestore();
    });

    it('triggers OCR validation for Aadhaar Card in Fresher Application', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument')
        .mockResolvedValueOnce({
          success: true,
          status: 'DOCUMENT_ACCEPTED',
          expectedType: 'AADHAAR',
          detectedType: 'AADHAAR',
          confidence: 0.95,
          message: 'Document accepted',
        });

      const { container } = render(<DocumentsUpload />);

      // Find file input for Aadhar Card
      const aadharInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(aadharInput).toBeInTheDocument();

      const aadharFile = new File(['aadhar content'], 'aadhar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [aadharFile] } });

      await waitFor(() => {
        expect(validateSpy).toHaveBeenCalledWith(aadharFile, 'Aadhar Card');
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith('app-123', aadharFile, 'AADHAR_CARD', 'Aadhar Card document');
      });
    });

    it('completely bypasses OCR and classification when uploading excluded documents in Fresher Application', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument');

      const { container } = render(<DocumentsUpload />);

      const fileInputs = container.querySelectorAll('input[type="file"]');
      // The 3rd input corresponds to Training certificate (after Aadhar and PAN)
      const trainingInput = fileInputs[2] as HTMLInputElement;
      expect(trainingInput).toBeInTheDocument();

      const trainingFile = new File(['training content'], 'training.pdf', { type: 'application/pdf' });
      fireEvent.change(trainingInput, { target: { files: [trainingFile] } });

      await waitFor(() => {
        // FileUploadService was called directly without OCR validation
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith('app-123', trainingFile, 'TRAINING_CERTIFICATE', 'Training certificate document');
      });

      // OCR service must NOT be called for Training certificate
      expect(validateSpy).not.toHaveBeenCalled();
      expect(screen.queryByText(/Validating document content/i)).not.toBeInTheDocument();
    });
  });

  describe('REVIEW_REQUIRED Confirmation Popup in Renewal Application (DocumentsSection)', () => {
    let validateSpy: jest.SpyInstance;
    const REVIEW_MSG =
      'Document identification confidence is insufficient (0). Please ensure the document is clearly readable.';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      validateSpy?.mockRestore();
    });

    it('shows confirmation popup for Aadhaar Card with REVIEW_REQUIRED, and handles Re-Upload then replacement', async () => {
      validateSpy = jest
        .spyOn(DocumentValidationService, 'validateDocument')
        .mockResolvedValueOnce({
          success: false,
          status: 'REVIEW_REQUIRED',
          expectedType: 'AADHAAR',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: REVIEW_MSG,
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'DOCUMENT_ACCEPTED',
          expectedType: 'AADHAAR',
          detectedType: 'AADHAAR',
          confidence: 0.92,
          message: 'Document accepted',
        });

      const onPatchMock = jest.fn();
      const onErrorMock = jest.fn();

      const { container } = render(
        <DocumentsSection
          formData={{}}
          renewalId="ren-123"
          onPatch={onPatchMock}
          onError={onErrorMock}
        />,
      );

      const aadharInput = container.querySelector('input[name="idProofUploaded"]') as HTMLInputElement;
      const blurryFile = new File(['blurry'], 'blurry_aadhaar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [blurryFile] } });

      // Popup appears with exact validation message and Re-Upload / Proceed buttons
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.getByText('Document Review Required')).toBeInTheDocument();
      expect(screen.getAllByText(REVIEW_MSG).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: 'Re-Upload' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument();

      // Should not stage the file while waiting for user decision
      expect(onPatchMock).not.toHaveBeenCalled();

      // Click Re-Upload
      fireEvent.click(screen.getByRole('button', { name: 'Re-Upload' }));

      // Popup closes and previous validation state is cleared
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Review Required')).not.toBeInTheDocument();
      expect(onPatchMock).not.toHaveBeenCalled();

      // Upload replacement document
      const clearFile = new File(['clear'], 'clear_aadhaar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [clearFile] } });

      await waitFor(() => {
        expect(validateSpy).toHaveBeenCalledTimes(2);
        expect(validateSpy).toHaveBeenLastCalledWith(clearFile, 'Aadhar Card');
        expect(screen.getByText(/Document Accepted:/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onPatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idProofUploaded: expect.objectContaining({
            fileName: 'clear_aadhaar.pdf',
          }),
        }),
      );
    });

    it('shows confirmation popup for PAN Card with REVIEW_REQUIRED, and Proceed preserves REVIEW_REQUIRED status without repeating popup', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument').mockResolvedValueOnce({
        success: false,
        status: 'REVIEW_REQUIRED',
        expectedType: 'PAN',
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: REVIEW_MSG,
      });

      const onPatchMock = jest.fn();
      const onStatusMock = jest.fn();

      const { container } = render(
        <DocumentsSection
          formData={{}}
          renewalId="ren-123"
          onPatch={onPatchMock}
          onStatus={onStatusMock}
        />,
      );

      const panInput = container.querySelector('input[name="panCardUploaded"]') as HTMLInputElement;
      const panFile = new File(['pan-low-conf'], 'pan_scan.pdf', { type: 'application/pdf' });
      fireEvent.change(panInput, { target: { files: [panFile] } });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click Proceed
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

      // Popup closes and does not reopen
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // Validation was only called once (no repeated validation/popup)
      expect(validateSpy).toHaveBeenCalledTimes(1);
      // File is staged
      expect(onPatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          panCardUploaded: expect.objectContaining({
            fileName: 'pan_scan.pdf',
          }),
        }),
      );
      // Original REVIEW_REQUIRED status is preserved, NOT changed to DOCUMENT_ACCEPTED
      expect(screen.getByText('Review Required')).toBeInTheDocument();
      expect(screen.queryByText(/Document Accepted:/i)).not.toBeInTheDocument();
    });

    it('does not show confirmation popup for DOCUMENT_ACCEPTED, DOCUMENT_MISMATCH, UNREADABLE, or INVALID_FILE', async () => {
      const statuses: Array<'DOCUMENT_ACCEPTED' | 'DOCUMENT_MISMATCH' | 'UNREADABLE' | 'INVALID_FILE'> = [
        'DOCUMENT_ACCEPTED',
        'DOCUMENT_MISMATCH',
        'UNREADABLE',
        'INVALID_FILE',
      ];

      for (const status of statuses) {
        validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument').mockResolvedValueOnce({
          success: status === 'DOCUMENT_ACCEPTED',
          status,
          expectedType: 'AADHAAR',
          detectedType: status === 'DOCUMENT_MISMATCH' ? 'PAN' : 'AADHAAR',
          confidence: status === 'DOCUMENT_ACCEPTED' ? 0.95 : 0,
          message: `Status: ${status}`,
        });

        const { container, unmount } = render(
          <DocumentsSection
            formData={{}}
            renewalId="ren-123"
            onPatch={jest.fn()}
          />,
        );

        const aadharInput = container.querySelector('input[name="idProofUploaded"]') as HTMLInputElement;
        const file = new File(['doc'], 'doc.pdf', { type: 'application/pdf' });
        fireEvent.change(aadharInput, { target: { files: [file] } });

        await waitFor(() => {
          expect(validateSpy).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        validateSpy.mockRestore();
        unmount();
      }
    });
  });

  describe('REVIEW_REQUIRED Confirmation Popup in Fresher Application (DocumentsUpload)', () => {
    let validateSpy: jest.SpyInstance;
    const REVIEW_MSG =
      'Document identification confidence is insufficient (0). Please ensure the document is clearly readable.';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      validateSpy?.mockRestore();
    });

    it('shows confirmation popup for Aadhaar Card with REVIEW_REQUIRED, and handles Re-Upload then replacement', async () => {
      validateSpy = jest
        .spyOn(DocumentValidationService, 'validateDocument')
        .mockResolvedValueOnce({
          success: false,
          status: 'REVIEW_REQUIRED',
          expectedType: 'AADHAAR',
          detectedType: 'UNKNOWN',
          confidence: 0,
          message: REVIEW_MSG,
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'DOCUMENT_ACCEPTED',
          expectedType: 'AADHAAR',
          detectedType: 'AADHAAR',
          confidence: 0.95,
          message: 'Document accepted',
        });

      const { container } = render(<DocumentsUpload />);

      const aadharInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const blurryFile = new File(['blurry'], 'blurry_aadhaar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [blurryFile] } });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.getByText('Document Review Required')).toBeInTheDocument();
      expect(screen.getAllByText(REVIEW_MSG).length).toBeGreaterThanOrEqual(1);
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();

      // Click Re-Upload
      fireEvent.click(screen.getByRole('button', { name: 'Re-Upload' }));

      // Popup closes and validation badge is cleared
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Review Required')).not.toBeInTheDocument();
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();

      // Upload replacement file
      const clearFile = new File(['clear'], 'clear_aadhaar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [clearFile] } });

      await waitFor(() => {
        expect(validateSpy).toHaveBeenCalledTimes(2);
        expect(FileUploadService.uploadFile).toHaveBeenCalledTimes(1);
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith(
          'app-123',
          clearFile,
          'AADHAR_CARD',
          'Aadhar Card document',
        );
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText(/Document Accepted:/i)).toBeInTheDocument();
    });

    it('shows confirmation popup for PAN Card with REVIEW_REQUIRED, and Proceed uploads once and preserves REVIEW_REQUIRED status', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument').mockResolvedValueOnce({
        success: false,
        status: 'REVIEW_REQUIRED',
        expectedType: 'PAN',
        detectedType: 'UNKNOWN',
        confidence: 0,
        message: REVIEW_MSG,
      });

      const { container } = render(<DocumentsUpload />);

      const fileInputs = container.querySelectorAll('input[type="file"]');
      const panInput = fileInputs[1] as HTMLInputElement;
      const panFile = new File(['pan'], 'pan_low.pdf', { type: 'application/pdf' });
      fireEvent.change(panInput, { target: { files: [panFile] } });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();

      // Click Proceed
      fireEvent.click(screen.getByRole('button', { name: 'Proceed' }));

      await waitFor(() => {
        expect(FileUploadService.uploadFile).toHaveBeenCalledTimes(1);
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith(
          'app-123',
          panFile,
          'PAN_CARD',
          'PAN Card document',
        );
      });

      // Popup closed and does not reappear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(validateSpy).toHaveBeenCalledTimes(1);
      // Original REVIEW_REQUIRED status is preserved, NOT changed to DOCUMENT_ACCEPTED
      expect(screen.getByText('Review Required')).toBeInTheDocument();
      expect(screen.queryByText(/Document Accepted:/i)).not.toBeInTheDocument();
    });

    it('still enforces required Aadhar Card upload on Next click', async () => {
      render(<DocumentsUpload />);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getAllByText('This document is required before proceeding.').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('renders PAN Card as required once and prevents proceeding when only Aadhar Card is uploaded', async () => {
      validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument').mockResolvedValueOnce({
        success: true,
        status: 'DOCUMENT_ACCEPTED',
        expectedType: 'AADHAAR',
        detectedType: 'AADHAAR',
        confidence: 0.96,
        message: 'Aadhaar Card verified.',
      });

      const { container } = render(<DocumentsUpload />);

      expect(screen.getAllByText('PAN Card')).toHaveLength(1);
      expect(screen.getAllByText('(required)')).toHaveLength(2);

      const aadharInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const aadharFile = new File(['aadhar'], 'aadhar.pdf', { type: 'application/pdf' });
      fireEvent.change(aadharInput, { target: { files: [aadharFile] } });

      await waitFor(() => {
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith('app-123', aadharFile, 'AADHAR_CARD', 'Aadhar Card document');
      });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getAllByText('This document is required before proceeding.').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('does not show confirmation popup for DOCUMENT_ACCEPTED or error statuses in Fresher Application', async () => {
      const statuses: Array<'DOCUMENT_ACCEPTED' | 'DOCUMENT_MISMATCH' | 'UNREADABLE' | 'INVALID_FILE'> = [
        'DOCUMENT_ACCEPTED',
        'DOCUMENT_MISMATCH',
        'UNREADABLE',
        'INVALID_FILE',
      ];

      for (const status of statuses) {
        validateSpy = jest.spyOn(DocumentValidationService, 'validateDocument').mockResolvedValueOnce({
          success: status === 'DOCUMENT_ACCEPTED',
          status,
          expectedType: 'AADHAAR',
          detectedType: status === 'DOCUMENT_MISMATCH' ? 'PAN' : 'AADHAAR',
          confidence: status === 'DOCUMENT_ACCEPTED' ? 0.95 : 0,
          message: `Status: ${status}`,
        });

        const { container, unmount } = render(<DocumentsUpload />);

        const aadharInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['doc'], 'doc.pdf', { type: 'application/pdf' });
        fireEvent.change(aadharInput, { target: { files: [file] } });

        await waitFor(() => {
          expect(validateSpy).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        validateSpy.mockRestore();
        unmount();
      }
    });
  });
});
