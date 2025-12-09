import toast from 'react-hot-toast';

// Resolve file URL for links - handles absolute, protocol-relative, data and relative paths
export const resolveFileHref = (fileUrl?: string | null) => {
  if (!fileUrl) return null;
  const trimmed = String(fileUrl).trim();
  if (!trimmed) return null;

  // Absolute HTTP(S) or data URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('//')
  ) {
    return trimmed;
  }

  // If URL starts with a single slash, make it absolute against current origin
  if (trimmed.startsWith('/')) {
    return window.location.origin + trimmed;
  }

  // If contains a protocol-like pattern (s3://, ftp://), return as-is
  if (trimmed.includes('://')) return trimmed;

  // Fallback: treat as relative path on current origin
  return window.location.origin + '/' + trimmed;
};

const isDataUrl = (value: string) => value.trim().toLowerCase().startsWith('data:');

const isHttpLike = (value: string) =>
  value.trim().toLowerCase().startsWith('http://') ||
  value.trim().toLowerCase().startsWith('https://') ||
  value.trim().startsWith('//');

const isProbablyBase64 = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned || cleaned.includes(' ')) return false;
  if (isDataUrl(cleaned) || isHttpLike(cleaned)) return false;
  // Basic base64 shape check
  return /^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length % 4 === 0;
};

const guessMimeFromName = (fileName?: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'txt':
      return 'text/plain';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
};

const blobFromBase64 = (data: string, mime?: string) => {
  const cleaned = data.replace(/^data:.*;base64,/, '').trim();
  const byteCharacters = atob(cleaned);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime || 'application/octet-stream' });
};

const openPdfBlob = (blob: Blob, fileName?: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const pdfWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (pdfWindow) {
    pdfWindow.document.write(
      `<html><head><title>${fileName || 'Document'}</title></head><body style="margin:0;padding:0;overflow:hidden;background:#111;"><object data="${blobUrl}" type="application/pdf" style="width:100%;height:100vh;"></object></body></html>`,
    );
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
};

const openImageBlob = (blob: Blob, fileName?: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const imgWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (imgWindow) {
    imgWindow.document.write(
      `<html><head><title>${fileName || 'Image'}</title></head><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:#111;"><img src="${blobUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`,
    );
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
};

const downloadBlob = (blob: Blob, fileName?: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
};

export const openDocumentFile = async (fileUrl: string, fileName?: string) => {
  const trimmed = fileUrl?.trim();
  if (!trimmed) {
    toast.error('Unable to resolve file URL');
    return;
  }

  try {
    // 1) Plain HTTP(S): open directly
    if (isHttpLike(trimmed)) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2) Data URL: open as-is (no re-fetch)
    if (isDataUrl(trimmed)) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    // 3) Raw Base64: convert safely to blob and preview
    if (isProbablyBase64(trimmed)) {
      const mime = guessMimeFromName(fileName);
      const blob = blobFromBase64(trimmed, mime);
      if (mime === 'application/pdf') {
        openPdfBlob(blob, fileName);
      } else if (mime.startsWith('image/')) {
        openImageBlob(blob, fileName);
      } else {
        downloadBlob(blob, fileName);
      }
      return;
    }

    // 4) Everything else: treat as relative/path and fetch with auth
    const href = resolveFileHref(trimmed);
    if (!href) {
      toast.error('Unable to resolve file URL');
      return;
    }

    const response = await fetch(href, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const mime = blob.type || guessMimeFromName(fileName);

    if (mime.includes('pdf')) {
      openPdfBlob(blob, fileName);
    } else if (mime.startsWith('image/')) {
      openImageBlob(blob, fileName);
    } else {
      downloadBlob(blob, fileName);
    }
  } catch (error: any) {
    console.error('Failed to open document:', error);
    toast.error(`Failed to open document: ${error.message}`);
  }
};

