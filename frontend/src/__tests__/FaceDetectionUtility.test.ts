import {
  detectFacesInImage,
  getFaceDetector,
  resetFaceDetector,
  SUCCESS_FACE_MESSAGE,
  NO_FACE_MESSAGE,
  getMultipleFacesMessage,
} from '../utils/faceDetection';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn(),
  },
  FaceDetector: {
    createFromOptions: jest.fn(),
  },
}));

describe('Face Detection Utility (MediaPipe)', () => {
  let mockDetector: { detect: jest.Mock; close: jest.Mock };

  beforeAll(() => {
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = jest.fn();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetFaceDetector();

    mockDetector = {
      detect: jest.fn(),
      close: jest.fn(),
    };

    (FilesetResolver.forVisionTasks as jest.Mock).mockResolvedValue({});
    (FaceDetector.createFromOptions as jest.Mock).mockResolvedValue(mockDetector);
  });

  afterEach(() => {
    resetFaceDetector();
  });

  const createMockImageElement = (width = 400, height = 400, complete = true): HTMLImageElement => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'complete', { value: complete, writable: true });
    Object.defineProperty(img, 'naturalWidth', { value: width, writable: true });
    Object.defineProperty(img, 'naturalHeight', { value: height, writable: true });
    return img;
  };

  describe('Rule A: Exactly One Person Detected', () => {
    it('returns success when exactly 1 face is detected in the image', async () => {
      mockDetector.detect.mockReturnValue({
        detections: [{ categories: [{ score: 0.95 }] }],
      });

      const mockImg = createMockImageElement(400, 400, true);
      const result = await detectFacesInImage(mockImg);

      expect(result.faceCount).toBe(1);
      expect(result.status).toBe('success');
      expect(result.canUpload).toBe(true);
      expect(result.message).toBe(SUCCESS_FACE_MESSAGE);
      expect(result.message).toBe('One person detected. You can Upload photograph.');
    });
  });

  describe('Rule B: Multiple Persons Detected', () => {
    it('returns error when 2 faces are detected with dynamic count', async () => {
      mockDetector.detect.mockReturnValue({
        detections: [
          { categories: [{ score: 0.92 }] },
          { categories: [{ score: 0.88 }] },
        ],
      });

      const mockImg = createMockImageElement(400, 400, true);
      const result = await detectFacesInImage(mockImg);

      expect(result.faceCount).toBe(2);
      expect(result.status).toBe('error');
      expect(result.canUpload).toBe(false);
      expect(result.message).toBe('❌ Multiple persons detected (2). Only one person is allowed.');
      expect(result.message).toBe(getMultipleFacesMessage(2));
    });

    it('returns error with dynamic count when 3 or more faces are detected', async () => {
      mockDetector.detect.mockReturnValue({
        detections: [
          { categories: [{ score: 0.91 }] },
          { categories: [{ score: 0.89 }] },
          { categories: [{ score: 0.87 }] },
          { categories: [{ score: 0.85 }] },
        ],
      });

      const mockImg = createMockImageElement(400, 400, true);
      const result = await detectFacesInImage(mockImg);

      expect(result.faceCount).toBe(4);
      expect(result.status).toBe('error');
      expect(result.canUpload).toBe(false);
      expect(result.message).toBe('❌ Multiple persons detected (4). Only one person is allowed.');
    });
  });

  describe('Rule C: No Person Detected', () => {
    it('returns warning when 0 faces are detected', async () => {
      mockDetector.detect.mockReturnValue({
        detections: [],
      });

      const mockImg = createMockImageElement(400, 400, true);
      const result = await detectFacesInImage(mockImg);

      expect(result.faceCount).toBe(0);
      expect(result.status).toBe('warning');
      expect(result.canUpload).toBe(false);
      expect(result.message).toBe(NO_FACE_MESSAGE);
      expect(result.message).toBe('No person detected. Please upload a photograph containing one person.');
    });
  });

  describe('Invalid or Corrupted Image', () => {
    it('handles image loading failure gracefully and reports error', async () => {
      const brokenImg = createMockImageElement(400, 400, true);

      mockDetector.detect.mockImplementation(() => {
        throw new Error('Image appears corrupted or unreadable');
      });

      const result = await detectFacesInImage(brokenImg);

      expect(result.canUpload).toBe(false);
      expect(result.status).toBe('error');
      expect(result.faceCount).toBe(0);
      expect(result.message).toContain('corrupted or unreadable');
    });

    it('handles model initialization failure gracefully', async () => {
      (FaceDetector.createFromOptions as jest.Mock).mockRejectedValue(
        new Error('Could not load vision engine'),
      );

      const mockImg = createMockImageElement(400, 400, true);
      const result = await detectFacesInImage(mockImg);

      expect(result.canUpload).toBe(false);
      expect(result.status).toBe('error');
      expect(result.message).toBe('Could not load vision engine');
    });
  });

  describe('Singleton Pattern and Fallbacks', () => {
    it('reuses the same detector instance on repeated calls', async () => {
      const d1 = await getFaceDetector();
      const d2 = await getFaceDetector();

      expect(d1).toBe(d2);
      expect(FaceDetector.createFromOptions).toHaveBeenCalledTimes(1);
    });

    it('falls back to CPU delegate when GPU delegate fails', async () => {
      (FaceDetector.createFromOptions as jest.Mock)
        .mockRejectedValueOnce(new Error('WebGL not supported'))
        .mockResolvedValueOnce(mockDetector);

      const detector = await getFaceDetector();

      expect(detector).toBe(mockDetector);
      expect(FaceDetector.createFromOptions).toHaveBeenCalledTimes(2);
      expect(FaceDetector.createFromOptions).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        expect.objectContaining({
          baseOptions: expect.objectContaining({ delegate: 'CPU' }),
        }),
      );
    });
  });
});
