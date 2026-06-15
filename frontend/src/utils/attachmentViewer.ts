export const openAttachment = (att: any) => {
  try {
    const rawUrl =
      typeof att?.url === 'string'
        ? att.url
        : typeof att?.fileUrl === 'string'
        ? att.fileUrl
        : '';
    const fileName = att?.name || att?.fileName || 'attachment';
    if (!rawUrl) return;

    const isHttpUrl = /^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('/');
    const isDataUrl = rawUrl.startsWith('data:');

    // Helper: open a blob/content in a simple viewer HTML
    const openInViewer = (objectUrl: string, contentType: string) => {
      const viewer = window.open('', '_blank');
      if (!viewer) {
        // Popup blocked -> download
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const isPdf = /pdf/i.test(contentType);
      const isImage = /^image\//i.test(contentType);
      const isHtml = /html|text\//i.test(contentType) || fileName.toLowerCase().endsWith('.html');
      const safeTitle = fileName.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      let body = '';
      if (isPdf) {
        body =
          `<object data="${objectUrl}" type="application/pdf" style="width:100%;height:100vh;">` +
          `<p>PDF preview unavailable. <a href="${objectUrl}" target="_self" download="${safeTitle}">Download ${safeTitle}</a></p>` +
          `</object>`;
      } else if (isImage) {
        body = `<img src="${objectUrl}" alt="${safeTitle}" style="max-width:100%;height:auto;display:block;margin:0 auto;padding:16px;" />`;
      } else if (isHtml || contentType.includes('plain')) {
        // For ground reports and HTML content, try to render as iframe
        body = `<iframe src="${objectUrl}" style="width:100%;height:100vh;border:none;"></iframe>
                <div style="position:fixed;bottom:20px;right:20px;">
                  <a href="${objectUrl}" target="_self" download="${safeTitle}" style="padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;">Download</a>
                </div>`;
      } else {
        body = `<div style="padding:16px;font-family:system-ui,Segoe UI,Arial;">
           <p>Preview not supported for this file type (${contentType}).</p>
           <a href="${objectUrl}" target="_self" download="${safeTitle}">Download ${safeTitle}</a>
         </div>`;
      }

      viewer.document.open();
      viewer.document.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${safeTitle}</title><style>body{margin:0;padding:0;}</style></head><body style="margin:0;">${body}</body></html>`
      );
      viewer.document.close();
    };

    if (isHttpUrl) {
      // Let browser handle http(s) directly (respecting Content-Disposition)
      const win = window.open(rawUrl, '_blank', 'noopener');
      if (!win) {
        const a = document.createElement('a');
        a.href = rawUrl;
        a.download = fileName;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    // Build Blob from data URL or bare base64
    let base64Data = '';
    // Infer content type from name if not provided
    let contentType =
      att?.contentType ||
      (() => {
        const lower = (fileName || '').toLowerCase();
        if (lower.endsWith('.pdf')) return 'application/pdf';
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.gif')) return 'image/gif';
        if (lower.endsWith('.svg')) return 'image/svg+xml';
        if (lower.endsWith('.txt')) return 'text/plain';
        return 'application/octet-stream';
      })();
    if (isDataUrl) {
      const match = rawUrl.match(/^data:([^;]+);base64,(.*)$/i);
      if (match) {
        contentType = match[1] || contentType;
        base64Data = match[2] || '';
      } else {
        // Non-base64 data URL; open as-is
        const win = window.open(rawUrl, '_blank', 'noopener');
        if (!win) {
          const a = document.createElement('a');
          a.href = rawUrl;
          a.download = fileName;
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return;
      }
    } else {
      // Bare base64 string; normalize URL-safe base64 and pad
      base64Data = rawUrl;
    }

    // Normalize base64 (URL-safe -> standard) and remove whitespace
    let normalized = (base64Data || '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    if (padding) normalized += '='.repeat(4 - padding);

    // Decode base64 to Blob
    const byteChars = atob(normalized);
    const len = byteChars.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([u8.buffer], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    openInViewer(blobUrl, contentType);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (e) {
    // Last-resort message
    alert('Unable to preview file. It may still be downloadable from the history.');
  }
};
