'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { resolveFileHref, getAuthToken } from '@/services/fileHandler';

export interface DocumentPreviewPayload {
  url: string;
  fileName?: string;
  fileType?: string;
  rawDoc?: any;
}

export const previewDocument = (payload: DocumentPreviewPayload) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<DocumentPreviewPayload>('alms:open-document-preview', {
        detail: payload,
      })
    );
  }
};

export const DocumentViewerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<DocumentPreviewPayload | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Check file type
  const fileName = payload?.fileName || 'Document';
  const rawUrl = (payload?.url || '').trim();

  const isDataUrl = rawUrl.toLowerCase().startsWith('data:');
  const isImageByMime =
    payload?.fileType?.toLowerCase().includes('image') ||
    rawUrl.toLowerCase().startsWith('data:image/');
  const isPdfByMime =
    payload?.fileType?.toLowerCase().includes('pdf') ||
    rawUrl.toLowerCase().startsWith('data:application/pdf');

  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  const isImageByExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(fileExt);
  const isPdfByExt = fileExt === 'pdf';

  const isImage = isImageByMime || isImageByExt || (!isPdfByMime && !isPdfByExt && (rawUrl.match(/\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i) !== null));
  const isPdf = isPdfByMime || isPdfByExt || (!isImage && rawUrl.match(/\.pdf(\?.*)?$/i) !== null);

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      window.URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
    setResolvedSrc(null);
    setZoom(100);
    setRotation(0);
    setError(null);
    setLoading(false);
    cleanupObjectUrl();
  }, [cleanupObjectUrl]);

  // Load preview data when payload changes
  useEffect(() => {
    if (!payload || !payload.url) return;

    setZoom(100);
    setRotation(0);
    setError(null);
    cleanupObjectUrl();

    const url = payload.url.trim();

    // 1) Data URLs or Blobs can be used directly without fetching
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      setResolvedSrc(url);
      setLoading(false);
      return;
    }

    // 2) If it's pure Base64 without data: prefix
    if (!url.includes(' ') && !url.startsWith('http') && !url.startsWith('/') && url.length > 50 && /^[A-Za-z0-9+/=]+$/.test(url)) {
      const mime = isPdf ? 'application/pdf' : 'image/jpeg';
      setResolvedSrc(`data:${mime};base64,${url}`);
      setLoading(false);
      return;
    }

    // 3) HTTP(S) or server path
    const resolved = resolveFileHref(url);
    if (!resolved) {
      setError('Unable to resolve file path.');
      return;
    }

    // For public direct links or relative paths, fetch with auth token to create a blob for reliable previewing
    setLoading(true);
    let cancelled = false;

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(resolved, {
      method: 'GET',
      credentials: 'include',
      headers,
    })
      .then(async res => {
        if (!res.ok) {
          // If auth fetch fails, try using resolved URL directly as fallback
          if (!cancelled) {
            setResolvedSrc(resolved);
            setLoading(false);
          }
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;

        const blobUrl = window.URL.createObjectURL(blob);
        objectUrlRef.current = blobUrl;
        setResolvedSrc(blobUrl);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('Authenticated fetch failed, falling back to direct URL:', err);
        setResolvedSrc(resolved);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [payload, isPdf, cleanupObjectUrl]);

  // Listen for global open event
  useEffect(() => {
    const handleEvent = (e: CustomEvent<DocumentPreviewPayload>) => {
      if (e.detail && e.detail.url) {
        setPayload(e.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener('alms:open-document-preview' as any, handleEvent);
    return () => {
      window.removeEventListener('alms:open-document-preview' as any, handleEvent);
    };
  }, []);

  // Keyboard navigation (ESC to close, +/- for zoom)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(300, z + 25));
      } else if (e.key === '-') {
        setZoom(z => Math.max(25, z - 25));
      } else if (e.key === '0') {
        setZoom(100);
        setRotation(0);
      } else if (e.key.toLowerCase() === 'r') {
        setRotation(r => (r + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen || !payload) return null;

  const handleDownload = () => {
    const src = resolvedSrc || payload.url;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    const src = resolvedSrc || payload.url;
    if (!src) return;

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      window.open(src, '_blank');
      return;
    }

    if (isImage) {
      newWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .actions { display: flex; gap: 10px; align-items: center; }
    .btn {
      background: #2563eb;
      color: #fff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
    .btn:hover { background: #1d4ed8; }
    .content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    img {
      max-width: 100%;
      max-height: calc(100vh - 120px);
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${fileName}</div>
    <div class="actions">
      <a class="btn" href="${src}" download="${fileName}">Download</a>
    </div>
  </div>
  <div class="content">
    <img src="${src}" alt="${fileName}" />
  </div>
</body>
</html>`);
      newWindow.document.close();
    } else {
      newWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${fileName}</title>
  <style>html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#111; }</style>
</head>
<body>
  <iframe src="${src}" style="width:100%; height:100%; border:none;"></iframe>
</body>
</html>`);
      newWindow.document.close();
    }
  };

  return (
    <div
      className='fixed inset-0 z-[9999] flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200'
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Top Header / Toolbar */}
      <div className='flex items-center justify-between px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 text-white select-none z-10'>
        <div className='flex items-center gap-3 min-w-0 pr-4'>
          <div className='p-2 rounded-lg bg-slate-800 text-blue-400 flex-shrink-0'>
            {isImage ? <ImageIcon className='w-5 h-5' /> : <FileText className='w-5 h-5' />}
          </div>
          <div className='min-w-0'>
            <h2 className='text-sm font-semibold text-slate-100 truncate' title={fileName}>
              {fileName}
            </h2>
            <p className='text-xs text-slate-400'>
              {isImage ? 'Image Preview' : isPdf ? 'PDF Document' : 'Document File'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className='flex items-center gap-1 sm:gap-2'>
          {isImage && (
            <>
              <button
                type='button'
                onClick={() => setZoom(z => Math.max(25, z - 25))}
                className='p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition'
                title='Zoom Out (-)'
              >
                <ZoomOut className='w-4 h-4' />
              </button>
              <span className='text-xs font-mono text-slate-400 w-12 text-center select-none'>
                {zoom}%
              </span>
              <button
                type='button'
                onClick={() => setZoom(z => Math.min(300, z + 25))}
                className='p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition'
                title='Zoom In (+)'
              >
                <ZoomIn className='w-4 h-4' />
              </button>
              <button
                type='button'
                onClick={() => {
                  setZoom(100);
                  setRotation(0);
                }}
                className='p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition'
                title='Reset Zoom & Rotation (0)'
              >
                <Maximize2 className='w-4 h-4' />
              </button>
              <button
                type='button'
                onClick={() => setRotation(r => (r + 90) % 360)}
                className='p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition'
                title='Rotate (R)'
              >
                <RotateCw className='w-4 h-4' />
              </button>
              <div className='w-px h-5 bg-slate-700 mx-1' />
            </>
          )}

          <button
            type='button'
            onClick={handleDownload}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700'
            title='Download file'
          >
            <Download className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>Download</span>
          </button>

          <button
            type='button'
            onClick={handleOpenInNewTab}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700'
            title='Open in new tab'
          >
            <ExternalLink className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>New Tab</span>
          </button>

          <button
            type='button'
            onClick={handleClose}
            className='p-2 ml-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white transition'
            title='Close (Esc)'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        className='flex-1 overflow-auto flex items-center justify-center p-4 relative'
        onClick={e => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {loading && (
          <div className='flex flex-col items-center justify-center text-slate-300 gap-3'>
            <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
            <p className='text-sm font-medium'>Loading preview…</p>
          </div>
        )}

        {error && !loading && (
          <div className='max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-300'>
            <AlertCircle className='w-10 h-10 text-amber-500 mx-auto mb-3' />
            <h3 className='text-base font-bold text-white mb-1'>Unable to display document</h3>
            <p className='text-xs text-slate-400 mb-4'>{error}</p>
            <button
              onClick={handleDownload}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition'
            >
              <Download className='w-4 h-4' />
              Download Document Directly
            </button>
          </div>
        )}

        {!loading && !error && resolvedSrc && (
          <>
            {isImage ? (
              <div
                className='transition-transform duration-200 ease-out flex items-center justify-center'
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={resolvedSrc}
                  alt={fileName}
                  className='max-w-[85vw] max-h-[82vh] object-contain rounded-lg shadow-2xl select-none'
                  draggable={false}
                  onError={() => {
                    setError('The image could not be loaded or format is unsupported.');
                  }}
                />
              </div>
            ) : isPdf ? (
              <div className='w-full h-full max-w-6xl max-h-[86vh] bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800'>
                <iframe
                  src={resolvedSrc}
                  title={fileName}
                  className='w-full h-full border-0'
                />
              </div>
            ) : (
              <div className='max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-300'>
                <FileText className='w-12 h-12 text-blue-400 mx-auto mb-3' />
                <h3 className='text-base font-bold text-white mb-1'>{fileName}</h3>
                <p className='text-xs text-slate-400 mb-4'>
                  Preview is not available for this file type in the browser.
                </p>
                <button
                  onClick={handleDownload}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition'
                >
                  <Download className='w-4 h-4' />
                  Download File
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default DocumentViewerModal;
