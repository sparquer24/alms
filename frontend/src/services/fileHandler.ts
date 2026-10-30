import toast from 'react-hot-toast';
import jsCookie from 'js-cookie';

const getApiServerOrigin = () => {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  return apiBase.replace(/\/api$/, '') || apiBase;
};

export const getAuthToken = (): string | null => {
  try {
    const authCookie = jsCookie.get('auth');
    if (!authCookie) return null;
    try {
      const parsed = JSON.parse(authCookie);
      return parsed.token || parsed.accessToken || parsed.authToken || authCookie;
    } catch {
      return authCookie;
    }
  } catch {
    return null;
  }
};

/** Normalize upload objects from API, form state, or local File picks */
export const getDocumentUploadMeta = (obj: any) => {
  if (!obj) {
    return {
      uploaded: false,
      fileName: undefined as string | undefined,
      fileUrl: undefined as string | undefined,
      fileType: undefined as string | undefined,
      id: undefined as number | undefined,
    };
  }

  if (typeof File !== 'undefined' && obj instanceof File) {
    return {
      uploaded: true,
      fileName: obj.name,
      fileUrl: URL.createObjectURL(obj),
      fileType: obj.type || undefined,
      id: undefined as number | undefined,
      isLocalFile: true,
    };
  }

  const fileName =
    obj?.fileName || obj?.filename || obj?.name || obj?.file_name || (typeof obj === 'string' ? obj : undefined);
  const fileUrl = obj?.fileUrl || obj?.url || obj?.path || obj?.file_url;
  const fileType = obj?.fileType || obj?.type || obj?.mime || obj?.file_type;
  const id =
    typeof obj?.id === 'number'
      ? obj.id
      : typeof obj?.fileId === 'number'
      ? obj.fileId
      : undefined;
  return { uploaded: Boolean(fileName || fileUrl), fileName, fileUrl, fileType, id, isLocalFile: false };
};

// Resolve file URL for links - handles absolute, protocol-relative, data and relative paths
export const resolveFileHref = (fileUrl?: string | null) => {
  if (!fileUrl) return null;
  const trimmed = String(fileUrl).trim();
  if (!trimmed) return null;

  // Absolute HTTP(S), blob, or data URLs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('//')
  ) {
    return trimmed;
  }

  const serverOrigin = typeof window !== 'undefined' ? getApiServerOrigin() : '';

  // If URL starts with a single slash, resolve against API server (not Next.js origin)
  if (trimmed.startsWith('/')) {
    return serverOrigin ? serverOrigin + trimmed : trimmed;
  }

  // If contains a protocol-like pattern (s3://, ftp://), return as-is
  if (trimmed.includes('://')) return trimmed;

  // Fallback: treat as relative path on API server
  return serverOrigin ? `${serverOrigin}/${trimmed}` : trimmed;
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
    case 'svg':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
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

const renderImageViewerHtml = (src: string, title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
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
    <div class="title">${title}</div>
    <div class="actions">
      <a class="btn" href="${src}" download="${title}">Download</a>
    </div>
  </div>
  <div class="content">
    <img src="${src}" alt="${title}" />
  </div>
</body>
</html>`;

const openPdfBlob = (blob: Blob, fileName?: string) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const title = fileName || 'PDF Document';
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>html, body { margin:0; padding:0; height:100%; overflow:hidden; background:#111; }</style>
</head>
<body>
  <iframe src="${blobUrl}" style="width:100%; height:100%; border:none;"></iframe>
</body>
</html>`);
    win.document.close();
  } else {
    window.open(blobUrl, '_blank');
  }
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 120_000);
};

const openImageBlob = (blob: Blob, fileName?: string) => {
  const title = fileName || 'Image Preview';
  const reader = new FileReader();
  reader.onloadend = () => {
    const dataUrl = reader.result as string;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(renderImageViewerHtml(dataUrl, title));
      win.document.close();
    } else {
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    }
  };
  reader.readAsDataURL(blob);
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
    // 0) Blob URLs (local file preview before/without server upload)
    if (trimmed.startsWith('blob:')) {
      try {
        const response = await fetch(trimmed);
        if (response.ok) {
          const blob = await response.blob();
          const mime = blob.type || guessMimeFromName(fileName);
          if (mime.includes('pdf')) {
            openPdfBlob(blob, fileName);
          } else if (mime.startsWith('image/')) {
            openImageBlob(blob, fileName);
          } else {
            window.open(trimmed, '_blank');
          }
        } else {
          window.open(trimmed, '_blank');
        }
      } catch {
        window.open(trimmed, '_blank');
      }
      return;
    }

    // 1) Data URL
    if (isDataUrl(trimmed)) {
      const mimeMatch = trimmed.match(/^data:([^;]+);/i);
      const mimeFromData = mimeMatch ? mimeMatch[1].toLowerCase() : '';
      const mime = (mimeFromData && mimeFromData !== 'application/octet-stream') ? mimeFromData : guessMimeFromName(fileName);
      if (mime.includes('pdf')) {
        const blob = blobFromBase64(trimmed, mime);
        openPdfBlob(blob, fileName);
      } else if (mime.startsWith('image/')) {
        const title = fileName || 'Image Preview';
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(renderImageViewerHtml(trimmed, title));
          win.document.close();
        } else {
          window.open(trimmed, '_blank');
        }
      } else {
        const blob = blobFromBase64(trimmed, mime);
        downloadBlob(blob, fileName);
      }
      return;
    }

    // 2) Raw Base64
    if (isProbablyBase64(trimmed)) {
      let mime = guessMimeFromName(fileName);
      // Auto-detect common signatures
      if (trimmed.startsWith('/9j/')) mime = 'image/jpeg';
      else if (trimmed.startsWith('iVBORw0KGgo')) mime = 'image/png';
      else if (trimmed.startsWith('JVBERi0')) mime = 'application/pdf';

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

    // 3) HTTP(S) or server paths
    const href = resolveFileHref(trimmed);
    if (!href) {
      toast.error('Unable to resolve file URL');
      return;
    }

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(href, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const mime = (contentType && contentType !== 'application/octet-stream') ? contentType : (blob.type || guessMimeFromName(fileName));

      if (mime.includes('pdf')) {
        openPdfBlob(blob, fileName);
      } else if (mime.startsWith('image/')) {
        openImageBlob(blob, fileName);
      } else {
        downloadBlob(blob, fileName);
      }
    } catch (fetchError: any) {
      console.warn('Fetch failed, falling back to direct open:', fetchError);
      window.open(href, '_blank');
    }
  } catch (error: any) {
    console.error('Failed to open document:', error);
    toast.error(`Failed to open document: ${error.message}`);
  }
};
