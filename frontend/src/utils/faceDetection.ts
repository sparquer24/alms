/**
 * MediaPipe Face Detection Utility for ALMS
 * Reuses @mediapipe/tasks-vision models and WASM assets for single-person photograph validation.
 */

import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';

export const SUCCESS_FACE_MESSAGE = 'One person detected. You can Upload photograph.';
export const NO_FACE_MESSAGE = 'No person detected. Please upload a photograph containing one person.';
export const getMultipleFacesMessage = (count: number): string =>
  `❌ Multiple persons detected (${count}). Only one person is allowed.`;

export interface FaceDetectionResult {
  faceCount: number;
  status: 'success' | 'warning' | 'error';
  message: string;
  canUpload: boolean;
  detections?: any[];
  error?: string;
}

let detectorInstance: FaceDetector | null = null;
let detectorPromise: Promise<FaceDetector> | null = null;

/**
 * Initializes and returns the shared MediaPipe FaceDetector instance (Singleton).
 * Tries local static assets first (/mediapipe/wasm and /mediapipe/models) with graceful fallback to CDN.
 */
export async function getFaceDetector(): Promise<FaceDetector> {
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe FaceDetector can only be initialized in browser environment.');
  }

  if (detectorInstance) {
    return detectorInstance;
  }

  if (detectorPromise) {
    return detectorPromise;
  }

  detectorPromise = (async () => {
    // 1. Resolve Vision WASM binaries: local first, then CDN
    let vision: any;
    try {
      vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    } catch {
      vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );
    }

    // 2. Initialize FaceDetector: try GPU first, fallback to CPU, fallback to CDN model
    try {
      detectorInstance = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/models/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
      });
      return detectorInstance;
    } catch {
      try {
        detectorInstance = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/models/blaze_face_short_range.tflite',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
        });
        return detectorInstance;
      } catch {
        detectorInstance = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
        });
        return detectorInstance;
      }
    }
  })().catch((err) => {
    detectorPromise = null;
    throw err;
  });

  return detectorPromise;
}

/**
 * Reset detector singleton (useful for testing or memory cleanup)
 */
export function resetFaceDetector(): void {
  if (detectorInstance) {
    try {
      detectorInstance.close();
    } catch {
      // ignore
    }
  }
  detectorInstance = null;
  detectorPromise = null;
}

/**
 * Helper to safely load an image source into an HTMLImageElement
 */
export const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => {
      if (img.naturalWidth > 0) {
        resolve(img);
      } else {
        reject(new Error('The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.'));
      }
    }, 5000);
    img.onload = () => {
      clearTimeout(timer);
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image has zero dimensions or is unreadable.'));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.'));
    };
    img.src = src;
  });
};

/**
 * Detect faces in an image (File, Blob, data URL, or HTMLImageElement)
 * Returns structured validation result following ALMS rules.
 */
export async function detectFacesInImage(
  source: File | Blob | string | HTMLImageElement,
): Promise<FaceDetectionResult> {
  let createdUrl: string | null = null;
  let imgElement: HTMLImageElement | null = null;

  try {
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
      imgElement = source;
      if (!imgElement.complete && !imgElement.naturalWidth && imgElement.src) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(true), 3000);
          imgElement!.onload = () => {
            clearTimeout(timer);
            resolve(true);
          };
          imgElement!.onerror = () => {
            clearTimeout(timer);
            reject(
              new Error(
                'The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.',
              ),
            );
          };
        });
      }
    } else if (typeof Blob !== 'undefined' && source instanceof Blob) {
      createdUrl = URL.createObjectURL(source);
      imgElement = await loadImageElement(createdUrl);
    } else if (typeof source === 'string') {
      imgElement = await loadImageElement(source);
    } else {
      throw new Error('Unsupported image source type.');
    }

    const detector = await getFaceDetector();
    const detectionsResult = detector.detect(imgElement);
    const count = detectionsResult?.detections?.length || 0;

    if (count === 1) {
      return {
        faceCount: 1,
        status: 'success',
        message: SUCCESS_FACE_MESSAGE,
        canUpload: true,
        detections: detectionsResult.detections,
      };
    }

    if (count === 0) {
      return {
        faceCount: 0,
        status: 'warning',
        message: NO_FACE_MESSAGE,
        canUpload: false,
        detections: [],
      };
    }

    return {
      faceCount: count,
      status: 'error',
      message: getMultipleFacesMessage(count),
      canUpload: false,
      detections: detectionsResult.detections,
    };
  } catch (err: any) {
    const isCorrupt =
      err?.message?.includes('corrupted') ||
      err?.message?.includes('unreadable') ||
      err?.name === 'TypeError';

    return {
      faceCount: 0,
      status: 'error',
      message: isCorrupt
        ? 'The uploaded image file appears to be corrupted or unreadable. Please choose a valid image.'
        : err?.message || 'Face detection failed. Please ensure the image is valid and try again.',
      canUpload: false,
      error: err?.message || 'Detection error',
    };
  } finally {
    if (createdUrl) {
      try {
        URL.revokeObjectURL(createdUrl);
      } catch {
        // ignore
      }
    }
  }
}
