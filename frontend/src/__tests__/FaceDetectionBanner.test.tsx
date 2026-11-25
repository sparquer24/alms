import React from 'react';
import { render, screen } from '@testing-library/react';
import { FaceDetectionBanner } from '../components/forms/biometric/FaceDetectionBanner';
import { FaceDetectionResult } from '../utils/faceDetection';

describe('FaceDetectionBanner Component', () => {
  it('renders loading spinner and message when isDetecting is true', () => {
    render(<FaceDetectionBanner isDetecting={true} result={null} />);

    expect(screen.getByTestId('face-detection-loading')).toBeInTheDocument();
    expect(screen.getByText('Analyzing photograph for face detection...')).toBeInTheDocument();
  });

  it('renders success message when exactly 1 person is detected', () => {
    const result: FaceDetectionResult = {
      faceCount: 1,
      status: 'success',
      message: 'One person detected. You can Upload photograph.',
      canUpload: true,
    };

    render(<FaceDetectionBanner isDetecting={false} result={result} />);

    expect(screen.getByTestId('face-detection-success')).toBeInTheDocument();
    expect(
      screen.getByText('One person detected. You can Upload photograph.'),
    ).toBeInTheDocument();
  });

  it('renders warning message when no person is detected (0 faces)', () => {
    const result: FaceDetectionResult = {
      faceCount: 0,
      status: 'warning',
      message: 'No person detected. Please upload a photograph containing one person.',
      canUpload: false,
    };

    render(<FaceDetectionBanner isDetecting={false} result={result} />);

    expect(screen.getByTestId('face-detection-warning')).toBeInTheDocument();
    expect(
      screen.getByText('No person detected. Please upload a photograph containing one person.'),
    ).toBeInTheDocument();
  });

  it('renders error message when multiple persons are detected (e.g. 2)', () => {
    const result: FaceDetectionResult = {
      faceCount: 2,
      status: 'error',
      message: '❌ Multiple persons detected (2). Only one person is allowed.',
      canUpload: false,
    };

    render(<FaceDetectionBanner isDetecting={false} result={result} />);

    expect(screen.getByTestId('face-detection-error')).toBeInTheDocument();
    expect(
      screen.getByText('❌ Multiple persons detected (2). Only one person is allowed.'),
    ).toBeInTheDocument();
  });

  it('renders error message for corrupted or unreadable images', () => {
    const result: FaceDetectionResult = {
      faceCount: 0,
      status: 'error',
      message: 'The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.',
      canUpload: false,
    };

    render(<FaceDetectionBanner isDetecting={false} result={result} />);

    expect(screen.getByTestId('face-detection-error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.',
      ),
    ).toBeInTheDocument();
  });

  it('renders nothing when result is null and not detecting', () => {
    const { container } = render(<FaceDetectionBanner isDetecting={false} result={null} />);
    expect(container.firstChild).toBeNull();
  });
});
