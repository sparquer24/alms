import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import BiometricInformation from '../components/forms/freshApplication/BiometricInformation';
import MantraSDKService from '../services/mantraSDKService';
import { ApplicationService } from '../api/applicationService';

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
    get: jest.fn().mockReturnValue('app-123'),
  }),
}));

jest.mock('../services/mantraSDKService');
jest.mock('../api/applicationService');
jest.mock('../api/fileUploadService');

// Mock react-webcam
jest.mock('react-webcam', () => ({
  __esModule: true,
  default: () => <div data-testid="webcam-mock" />,
}));

describe('BiometricInformation - Fingerprint Device Toast Notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (ApplicationService.getApplication as jest.Mock).mockResolvedValue({
      data: {
        biometricData: null,
      },
    });
  });

  it('displays the success toast only once when device is detected and connected', async () => {
    (MantraSDKService.initialize as jest.Mock).mockResolvedValue(true);
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({
      isConnected: true,
    });

    await act(async () => {
      render(<BiometricInformation />);
    });

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Fingerprint device detected and ready',
        expect.objectContaining({
          toastId: 'fingerprint-device-connected-toast',
        })
      );
    });

    // Verify it was called exactly once
    const infoCalls = (toast.info as jest.Mock).mock.calls.filter(
      call => call[0] === 'Fingerprint device detected and ready'
    );
    expect(infoCalls.length).toBe(1);
  });

  it('prevents duplicate toasts when multiple device checks or re-renders occur while connected', async () => {
    (MantraSDKService.initialize as jest.Mock).mockResolvedValue(true);
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({
      isConnected: true,
    });

    const { rerender } = render(<BiometricInformation />);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Fingerprint device detected and ready',
        expect.anything()
      );
    });

    // Simulate re-renders
    rerender(<BiometricInformation />);
    rerender(<BiometricInformation />);

    // Trigger window focus event (background check)
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    const infoCalls = (toast.info as jest.Mock).mock.calls.filter(
      call => call[0] === 'Fingerprint device detected and ready'
    );
    // Should still only have been called ONCE
    expect(infoCalls.length).toBe(1);
  });

  it('allows the notification to appear again when device is disconnected and subsequently reconnected', async () => {
    (MantraSDKService.initialize as jest.Mock).mockResolvedValue(true);

    // Initial check: Connected
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({
      isConnected: true,
    });

    await act(async () => {
      render(<BiometricInformation />);
    });

    await waitFor(() => {
      const infoCalls = (toast.info as jest.Mock).mock.calls.filter(
        call => call[0] === 'Fingerprint device detected and ready'
      );
      expect(infoCalls.length).toBe(1);
    });

    // Simulate device disconnection (window focus or event detects disconnected)
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({
      isConnected: false,
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    // Simulate device reconnection
    (MantraSDKService.isDeviceConnected as jest.Mock).mockResolvedValue({
      isConnected: true,
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      const infoCalls = (toast.info as jest.Mock).mock.calls.filter(
        call => call[0] === 'Fingerprint device detected and ready'
      );
      // Toast was triggered twice: once on initial connection, once after reconnection
      expect(infoCalls.length).toBe(2);
    });
  });
});
