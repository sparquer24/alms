import { useState, useCallback, useRef } from 'react';
import {
  detectFacesInImage,
  FaceDetectionResult,
} from '../utils/faceDetection';

export function useFaceDetection() {
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [result, setResult] = useState<FaceDetectionResult | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  const detectFaces = useCallback(
    async (source: File | Blob | string | HTMLImageElement): Promise<FaceDetectionResult> => {
      const requestId = ++activeRequestIdRef.current;
      setIsDetecting(true);
      setResult(null);

      try {
        const detectionResult = await detectFacesInImage(source);
        if (requestId === activeRequestIdRef.current) {
          setResult(detectionResult);
          setIsDetecting(false);
        }
        return detectionResult;
      } catch (err: any) {
        const errorResult: FaceDetectionResult = {
          faceCount: 0,
          status: 'error',
          message:
            err?.message || 'Face detection failed. Please ensure the image is valid and try again.',
          canUpload: false,
          error: err?.message,
        };
        if (requestId === activeRequestIdRef.current) {
          setResult(errorResult);
          setIsDetecting(false);
        }
        return errorResult;
      }
    },
    [],
  );

  const resetDetection = useCallback(() => {
    activeRequestIdRef.current++;
    setIsDetecting(false);
    setResult(null);
  }, []);

  return {
    isDetecting,
    result,
    detectFaces,
    resetDetection,
    setResult,
  };
}
