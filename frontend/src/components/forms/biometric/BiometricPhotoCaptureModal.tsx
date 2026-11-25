'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FilesetResolver, FaceDetector } from '@mediapipe/tasks-vision';
import axiosInstance from '../../../api/axiosConfig';
import { getAuthTokenFromCookie } from '../../../utils/authCookies';

// Load react-webcam dynamically for SSR compatibility
const Webcam = dynamic(() => import('react-webcam').then((mod: any) => mod.default), {
  ssr: false,
}) as any;

interface BiometricPhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAccepted: (file: File, previewUrl: string, metadata?: any) => void;
  applicationId?: string | number | null;
  applicationType?: 'Fresh' | 'Renewal' | string;
}

export const BiometricPhotoCaptureModal: React.FC<BiometricPhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoAccepted,
  applicationId,
  applicationType = 'Fresh',
}) => {
  const webcamRef = useRef<any>(null);
  const [detector, setDetector] = useState<FaceDetector | null>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const [webcamReady, setWebcamReady] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  // Face detection states
  const [faceCount, setFaceCount] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState(false);

  // Capture / Preview states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Animation frame ref for continuous detection
  const animationFrameIdRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  // 1. Initialize MediaPipe FaceDetector
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      if (!isOpen) return;
      setModelLoading(true);
      setModelError(null);

      try {
        // Resolve WASM assets: try local /mediapipe/wasm first, fallback to CDN
        let vision: any;
        try {
          vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
          );
        }

        // Initialize FaceDetector: try local model first, fallback to CDN
        let faceDetectorInstance: FaceDetector;
        try {
          faceDetectorInstance = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/mediapipe/models/blaze_face_short_range.tflite',
              delegate: 'GPU',
            },
            runningMode: 'IMAGE',
          });
        } catch {
          try {
            faceDetectorInstance = await FaceDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath:
                  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
                delegate: 'CPU',
              },
              runningMode: 'IMAGE',
            });
          } catch (modelErr: any) {
            console.error('[BiometricPhotoCapture] Failed to load MediaPipe model:', modelErr);
            if (isMounted) {
              setModelError('Could not initialize facial detection model. Please check connection.');
            }
            return;
          }
        }

        if (isMounted) {
          setDetector(faceDetectorInstance);
          setModelLoading(false);
        }
      } catch (err: any) {
        console.error('[BiometricPhotoCapture] MediaPipe init error:', err);
        if (isMounted) {
          setModelError(err?.message || 'Failed to initialize vision engine.');
          setModelLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Real-time Face Detection Loop
  const runFaceDetection = useCallback(() => {
    if (!isOpen || capturedPhoto || !webcamReady || !detector) {
      return;
    }

    const now = Date.now();
    // Throttle detection to ~8 fps (every 120ms) for smooth real-time response without CPU lag
    if (now - lastDetectionTimeRef.current >= 120) {
      lastDetectionTimeRef.current = now;

      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          setIsDetecting(true);
          const detections = detector.detect(video);
          const count = detections.detections.length;
          setFaceCount(count);
        } catch {
          // ignore transient frame detection errors
        } finally {
          setIsDetecting(false);
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(runFaceDetection);
  }, [isOpen, capturedPhoto, webcamReady, detector]);

  useEffect(() => {
    if (isOpen && webcamReady && detector && !capturedPhoto) {
      animationFrameIdRef.current = requestAnimationFrame(runFaceDetection);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isOpen, webcamReady, detector, capturedPhoto, runFaceDetection]);

  // Reset modal state on close/open
  useEffect(() => {
    if (!isOpen) {
      setCapturedPhoto(null);
      setFaceCount(0);
      setWebcamReady(false);
      setCameraPermissionDenied(false);
      setUploadError(null);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    }
  }, [isOpen]);

  // 3. Handle photograph capture with client-side revalidation
  const handleCapture = async () => {
    if (!webcamRef.current) {
      toast.error('Webcam stream is not ready.');
      return;
    }

    // Must have exactly 1 face to capture
    if (faceCount !== 1) {
      if (faceCount === 0) toast.error('No person detected. Position your face in the oval guide.');
      else toast.error('Multiple persons detected. Only one person is allowed.');
      return;
    }

    const screenshot = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
    });

    if (!screenshot) {
      toast.error('Failed to capture frame from webcam.');
      return;
    }

    // Client-side Revalidation: Re-evaluate the still photograph frame with MediaPipe
    if (detector) {
      try {
        const img = new Image();
        img.src = screenshot;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const revalidationResult = detector.detect(img);
        const revalidatedCount = revalidationResult.detections.length;

        if (revalidatedCount !== 1) {
          if (revalidatedCount === 0) {
            toast.warning('Revalidation failed: No face detected in captured still image. Please hold still and retake.');
          } else {
            toast.warning(`Revalidation failed: Multiple persons detected (${revalidatedCount}). Only one person is allowed.`);
          }
          return;
        }
      } catch (err) {
        console.warn('[BiometricPhotoCapture] Still revalidation warning:', err);
      }
    }

    setCapturedPhoto(screenshot);
    setUploadError(null);
  };

  // 4. Retake photograph
  const handleRetake = () => {
    setCapturedPhoto(null);
    setUploadError(null);
  };

  // 5. Upload photograph to backend /api/biometric/upload
  const handleUpload = async () => {
    if (!capturedPhoto) return;

    setIsSubmitting(true);
    setUploadError(null);

    try {
      // Convert base64 dataURL to Blob / File
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const file = new File([blob], 'biometric_photo.jpg', { type: 'image/jpeg' });

      // Prepare payload
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('faceCount', '1');
      if (applicationId) {
        formData.append('applicationId', String(applicationId));
        formData.append('applicationType', applicationType);
      }
      formData.append('capturedAt', new Date().toISOString());

      const token = getAuthTokenFromCookie();
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Backend API call
      const uploadResp = await axiosInstance.post('/biometric/upload', formData, {
        headers,
      });

      const data = uploadResp?.data || uploadResp;
      toast.success('Biometric photograph captured, validated, and saved successfully!');

      // Notify parent component with file, preview, and response payload (including fileId and fileUrl)
      onPhotoAccepted(file, capturedPhoto, data);
      onClose();
    } catch (err: any) {
      console.error('[BiometricPhotoCapture] Upload failed:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload and validate biometric photograph.';
      setUploadError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
      style={{ display: 'flex' }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-[#0B1F3A] text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold">Biometric Photograph Capture</h3>
            <p className="text-xs text-slate-300">
              Live face detection powered by Google MediaPipe
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-300 hover:text-white p-1 rounded-full text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col items-center">
          {/* Permission / Model Errors */}
          {cameraPermissionDenied && (
            <div className="w-full bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-xs mb-3">
              <strong className="block font-semibold">Camera Access Denied</strong>
              Please allow camera permissions in your browser address bar and reload.
            </div>
          )}

          {modelError && (
            <div className="w-full bg-amber-50 border border-amber-300 text-amber-700 px-4 py-2.5 rounded-lg text-xs mb-3">
              <span className="font-semibold">Detection Warning:</span> {modelError}
            </div>
          )}

          {/* Camera Frame / Preview Area */}
          <div className="relative w-full max-w-[420px] aspect-[4/3] bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
            {!capturedPhoto ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  mirrored={true} // Selfie mirroring
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'user',
                  }}
                  onUserMedia={() => {
                    setWebcamReady(true);
                    setCameraPermissionDenied(false);
                  }}
                  onUserMediaError={() => {
                    setWebcamReady(false);
                    setCameraPermissionDenied(true);
                  }}
                  className="w-full h-full object-cover"
                />

                {/* Oval Portrait Alignment Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-[58%] h-[82%] rounded-[50%] border-2 border-dashed transition-colors duration-300 ${
                      faceCount === 1
                        ? 'border-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                        : faceCount > 1
                        ? 'border-red-500 bg-red-500/15'
                        : 'border-white/70 bg-transparent'
                    }`}
                  />
                </div>

                {/* Loading overlay if webcam or model is not yet ready */}
                {(!webcamReady || modelLoading) && !cameraPermissionDenied && (
                  <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white text-xs gap-2">
                    <svg
                      className="animate-spin h-6 w-6 text-sky-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>
                      {modelLoading
                        ? 'Loading MediaPipe facial model...'
                        : 'Starting camera preview...'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* Captured Photograph Still Preview */
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured Photograph Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-600 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow">
                  ✓ Verified (1 Person)
                </div>
              </div>
            )}
          </div>

          {/* Real-time Facial Detection Status Banner */}
          {!capturedPhoto && webcamReady && (
            <div className="w-full max-w-[420px] mt-3">
              {faceCount === 0 && (
                <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-2 rounded-md text-xs font-medium">
                  <span className="text-sm">⚠️</span>
                  <span>No person detected. Position your face in the oval guide.</span>
                </div>
              )}

              {faceCount === 1 && (
                <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-300 text-green-800 px-3 py-2 rounded-md text-xs font-medium">
                  <span className="text-sm">✓</span>
                  <span>One person detected. You can capture your photograph.</span>
                </div>
              )}

              {faceCount > 1 && (
                <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-md text-xs font-medium">
                  <span className="text-sm">❌</span>
                  <span>Multiple persons detected ({faceCount}). Only one person is allowed.</span>
                </div>
              )}
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="w-full max-w-[420px] mt-2 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md text-xs">
              {uploadError}
            </div>
          )}

          <div className="text-[11px] text-gray-500 mt-2 text-center max-w-[400px]">
            Requirements: Centered portrait, neutral expression, plain background, minimum 200×200 pixels.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {!capturedPhoto ? (
              <button
                type="button"
                onClick={handleCapture}
                disabled={!webcamReady || faceCount !== 1}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded hover:bg-[#15325B] disabled:bg-gray-400 disabled:cursor-not-allowed shadow transition-colors"
              >
                Capture Photo
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow flex items-center gap-1.5 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Validating &amp; Uploading...</span>
                    </>
                  ) : (
                    <span>Upload &amp; Save</span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
