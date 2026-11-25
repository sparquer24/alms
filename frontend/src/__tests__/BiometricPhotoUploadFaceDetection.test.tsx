import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import FreshBiometricInformation from '../components/forms/freshApplication/BiometricInformation';
import RenewalBiometricInformation from '../components/forms/renewal/sections/BiometricInformation';
import { FileUploadService } from '../api/fileUploadService';
import RenewalService from '../api/renewalService';
import { ApplicationService } from '../api/applicationService';
import MantraSDKService from '../services/mantraSDKService';
import { detectFacesInImage } from '../utils/faceDetection';

// Mock dependencies
jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    dismiss: jest.fn(),
  },
}));

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

jest.mock('../api/fileUploadService');
jest.mock('../api/renewalService');
jest.mock('../api/applicationService');
jest.mock('../services/mantraSDKService');

// Mock face detection utility to control detected face counts accurately
jest.mock('../utils/faceDetection', () => {
  const actual = jest.requireActual('../utils/faceDetection');
  return {
    ...actual,
    detectFacesInImage: jest.fn(),
  };
});

// Mock dynamic Webcam
jest.mock('react-webcam', () => ({
  __esModule: true,
  default: () => <div data-testid="webcam-mock" />,
}));

describe('Automatic Single-Person Face Detection & Photograph Upload UI/UX in ALMS', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-preview-url');
      window.URL.revokeObjectURL = jest.fn();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (ApplicationService.getApplication as jest.Mock).mockResolvedValue({
      data: {
        biometricData: null,
      },
    });

    (MantraSDKService.initialize as jest.Mock).mockResolvedValue(false);
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({ isConnected: false });
  });

  const createDummyFile = (name = 'photo.jpg', size = 50 * 1024, type = 'image/jpeg') => {
    const file = new File(['dummy_content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  describe('1. Fresher Application - Photograph Upload & Status Behavior', () => {
    it('automatically uploads and saves photograph when exactly one person is detected', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (FileUploadService.uploadFile as jest.Mock).mockResolvedValueOnce({
        data: { id: 101, fileUrl: 'https://example.com/photo.jpg' },
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const validFile = createDummyFile('single_person.jpg', 60 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [validFile] } });
      });

      // Verification message must appear near upload field
      await waitFor(() => {
        expect(
          screen.getByText('One person detected. You can Upload photograph.'),
        ).toBeInTheDocument();
      });

      // Automatically uploaded without needing manual button click
      await waitFor(() => {
        expect(FileUploadService.uploadFile).toHaveBeenCalledTimes(1);
        expect(FileUploadService.uploadFile).toHaveBeenCalledWith(
          'app-123',
          validFile,
          'PHOTOGRAPH',
          'Photograph',
        );
      });

      // Success status "✓ Photo Saved" displayed and Delete button visible
      await waitFor(() => {
        expect(screen.getByText('✓ Photo Saved')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      // "Upload Photograph" and "Choose Another Photograph" buttons must be hidden once saved
      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Choose Another Photograph')).not.toBeInTheDocument();
    });

    it('hides Upload and Delete buttons and shows ONLY the single left-side Choose Another Photograph button when multiple persons (2) detected', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 2,
        status: 'error',
        message: '❌ Multiple persons detected (2). Only one person is allowed.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const twoPersonFile = createDummyFile('two_people.jpg', 60 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [twoPersonFile] } });
      });

      // Verify dynamic count error message
      await waitFor(() => {
        expect(
          screen.getByText('❌ Multiple persons detected (2). Only one person is allowed.'),
        ).toBeInTheDocument();
      });

      // Upload and Delete buttons MUST be hidden
      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

      // Delete confirmation alert must NOT be displayed or triggered
      expect(
        screen.queryByText(/Are you sure you want to delete the photograph/i),
      ).not.toBeInTheDocument();

      // EXACTLY ONE "Choose Another Photograph" button (on the left side) - NO duplicate under preview
      const chooseAnotherElements = screen.getAllByText('Choose Another Photograph');
      expect(chooseAnotherElements).toHaveLength(1);

      // Verify backend API was NEVER called
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('hides Upload and Delete buttons and shows no duplicate button when 3+ persons detected', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 3,
        status: 'error',
        message: '❌ Multiple persons detected (3). Only one person is allowed.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const threePersonFile = createDummyFile('group_photo.jpg', 80 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [threePersonFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('❌ Multiple persons detected (3). Only one person is allowed.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('hides Upload and Delete buttons and shows no duplicate button when no person is detected (0 faces)', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 0,
        status: 'warning',
        message: 'No person detected. Please upload a photograph containing one person.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const landscapeFile = createDummyFile('scenery.jpg', 60 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [landscapeFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('No person detected. Please upload a photograph containing one person.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('hides Upload and Delete buttons on corrupted or unreadable images', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 0,
        status: 'error',
        message: 'The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const corruptFile = createDummyFile('corrupted.jpg', 40 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [corruptFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('enforces 3 MB file size limit in Fresher Application', async () => {
      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const over3MBFile = createDummyFile('large_photo.jpg', 3.5 * 1024 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [over3MBFile] } });
      });

      expect(toast.error).toHaveBeenCalled();
      expect(detectFacesInImage).not.toHaveBeenCalled();
      expect(FileUploadService.uploadFile).not.toHaveBeenCalled();
    });

    it('replaces an incorrect photograph with a correct photograph and automatically saves it', async () => {
      // Step 1: Select 2-person photo
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 2,
        status: 'error',
        message: '❌ Multiple persons detected (2). Only one person is allowed.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      let fileInput = view.container.querySelector('input[name="photograph"]');
      const badFile = createDummyFile('bad_two_persons.jpg', 60 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [badFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('❌ Multiple persons detected (2). Only one person is allowed.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();

      // Step 2: User selects correct 1-person photograph using existing Choose Another Photograph button
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (FileUploadService.uploadFile as jest.Mock).mockResolvedValueOnce({
        data: { id: 202, fileUrl: 'https://example.com/good.jpg' },
      });

      const goodFile = createDummyFile('correct_single_person.jpg', 65 * 1024);

      fileInput = view.container.querySelector('input[name="photograph"]');
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [goodFile] } });
      });

      // Previous error message should be cleared and success message shown
      await waitFor(() => {
        expect(
          screen.queryByText('❌ Multiple persons detected (2). Only one person is allowed.'),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText('One person detected. You can Upload photograph.'),
        ).toBeInTheDocument();
      });

      // Automatically uploaded and saved
      await waitFor(() => {
        expect(FileUploadService.uploadFile).toHaveBeenCalledTimes(1);
        expect(screen.getByText('✓ Photo Saved')).toBeInTheDocument();
      });
    });

    it('handles upload failure gracefully: does not show ✓ Photo Saved and keeps Choose Another visible', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (FileUploadService.uploadFile as jest.Mock).mockRejectedValueOnce(
        new Error('Network connection timeout'),
      );

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const validFile = createDummyFile('valid.jpg', 55 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [validFile] } });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network connection timeout');
      });

      // Success status must NOT be displayed
      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();

      // Applicant can recover using the single left "Choose Another Photograph" button
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
    });

    it('allows deleting a successfully uploaded photograph with confirmation alert', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (FileUploadService.uploadFile as jest.Mock).mockResolvedValueOnce({
        data: { id: 888, fileUrl: 'https://example.com/uploaded.jpg' },
      });
      (FileUploadService.deleteFile as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      let view: any;
      await act(async () => {
        view = render(<FreshBiometricInformation />);
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createDummyFile('photo.jpg')] } });
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Photo Saved')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      expect(deleteBtn).toBeInTheDocument();

      // Click delete button -> trigger confirmation alert
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      expect(
        screen.getByText('Are you sure you want to delete the photograph? This action cannot be undone.'),
      ).toBeInTheDocument();

      // Confirm deletion
      const confirmBtn = screen.getByRole('button', { name: /yes, delete/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(FileUploadService.deleteFile).toHaveBeenCalledWith(888);
        expect(toast.success).toHaveBeenCalledWith('Photograph deleted successfully!');
      });

      // After delete, preview is cleared and upload box returns to initial state
      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Photograph')).toBeInTheDocument();
    });
  });

  describe('2. Renewal Application - Photograph Upload & Status Behavior', () => {
    it('accepts photograph of 3 MB or less in Renewal Application and automatically saves it', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (RenewalService.uploadDocument as jest.Mock).mockResolvedValueOnce({
        id: 301,
        fileName: 'renewal_photo.jpg',
        fileUrl: 'https://example.com/renewal_photo.jpg',
        fileType: 'PHOTOGRAPH',
      });

      const onFileChangeMock = jest.fn();

      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={onFileChangeMock}
          />,
        );
      });

      // Verify displayed file size text is 20 KB - 3 MB
      expect(screen.getByText('Supports JPG, JPEG, PNG (20 KB - 3 MB)')).toBeInTheDocument();

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const valid3MBFile = createDummyFile('renewal_under_3mb.jpg', 2.8 * 1024 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [valid3MBFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('One person detected. You can Upload photograph.'),
        ).toBeInTheDocument();
      });

      // Automatically calls RenewalService uploadDocument
      await waitFor(() => {
        expect(RenewalService.uploadDocument).toHaveBeenCalledTimes(1);
        expect(RenewalService.uploadDocument).toHaveBeenCalledWith(
          'ren-456',
          'PHOTOGRAPH',
          valid3MBFile,
        );
      });

      // "✓ Photo Saved" and Delete button visible
      await waitFor(() => {
        expect(screen.getByText('✓ Photo Saved')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });

      // Upload and Choose Another Photograph hidden
      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Choose Another Photograph')).not.toBeInTheDocument();
    });

    it('rejects photograph larger than 3 MB in Renewal Application with file size validation error', async () => {
      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={jest.fn()}
          />,
        );
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const over3MBFile = createDummyFile('large_renewal.jpg', 3.5 * 1024 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [over3MBFile] } });
      });

      expect(toast.error).toHaveBeenCalled();
      expect(detectFacesInImage).not.toHaveBeenCalled();
      expect(RenewalService.uploadDocument).not.toHaveBeenCalled();
    });

    it('hides Upload and Delete buttons and shows ONLY the single left Choose Another button when multiple persons detected in Renewal', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 2,
        status: 'error',
        message: '❌ Multiple persons detected (2). Only one person is allowed.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={jest.fn()}
          />,
        );
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const multiFile = createDummyFile('renewal_multi.jpg', 70 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [multiFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('❌ Multiple persons detected (2). Only one person is allowed.'),
        ).toBeInTheDocument();
      });

      // Buttons hidden
      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Are you sure you want to delete the photograph/i)).not.toBeInTheDocument();

      // Exactly ONE Choose Another Photograph visible (on left side) - NO duplicate under preview
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);

      expect(RenewalService.uploadDocument).not.toHaveBeenCalled();
    });

    it('hides Upload and Delete buttons in Renewal when 0 persons are detected', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 0,
        status: 'warning',
        message: 'No person detected. Please upload a photograph containing one person.',
        canUpload: false,
      });

      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={jest.fn()}
          />,
        );
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      const blankFile = createDummyFile('blank.jpg', 70 * 1024);

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [blankFile] } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('No person detected. Please upload a photograph containing one person.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^upload photograph$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
      expect(RenewalService.uploadDocument).not.toHaveBeenCalled();
    });

    it('handles Renewal upload failure gracefully', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (RenewalService.uploadDocument as jest.Mock).mockRejectedValueOnce(
        new Error('Upload failed on server'),
      );

      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={jest.fn()}
          />,
        );
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createDummyFile('valid.jpg')] } });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Upload failed on server');
      });

      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();
      expect(screen.getAllByText('Choose Another Photograph')).toHaveLength(1);
    });

    it('allows deleting a successfully uploaded photograph in Renewal with confirmation alert', async () => {
      (detectFacesInImage as jest.Mock).mockResolvedValueOnce({
        faceCount: 1,
        status: 'success',
        message: 'One person detected. You can Upload photograph.',
        canUpload: true,
      });

      (RenewalService.uploadDocument as jest.Mock).mockResolvedValueOnce({
        id: 999,
        fileName: 'renewal_photo.jpg',
        fileUrl: 'https://example.com/renewal_photo.jpg',
        fileType: 'PHOTOGRAPH',
      });
      (RenewalService.deleteRenewalFile as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      let view: any;
      await act(async () => {
        view = render(
          <RenewalBiometricInformation
            formData={{}}
            renewalId="ren-456"
            onChange={jest.fn()}
            onFileChange={jest.fn()}
          />,
        );
      });

      const fileInput = view.container.querySelector('input[name="photograph"]');
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createDummyFile('photo.jpg')] } });
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Photo Saved')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /delete/i });
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      expect(
        screen.getByText('Are you sure you want to delete the photograph? This action cannot be undone.'),
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /yes, delete/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(RenewalService.deleteRenewalFile).toHaveBeenCalledWith(999);
        expect(toast.success).toHaveBeenCalledWith('Photograph deleted successfully!');
      });

      expect(screen.queryByText('✓ Photo Saved')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Photograph')).toBeInTheDocument();
    });
  });
});
