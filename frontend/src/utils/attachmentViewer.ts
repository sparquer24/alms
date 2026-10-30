import { openDocumentFile } from '../services/fileHandler';

export const openAttachment = (att: any) => {
  try {
    const rawUrl =
      typeof att?.url === 'string'
        ? att.url
        : typeof att?.fileUrl === 'string'
        ? att.fileUrl
        : typeof att?.path === 'string'
        ? att.path
        : '';
    const fileName = att?.name || att?.fileName || 'attachment';
    if (!rawUrl) return;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('alms:open-document-preview', {
          detail: {
            url: rawUrl,
            fileName,
            fileType: att?.type || att?.fileType || att?.contentType,
            rawDoc: att,
          },
        })
      );
      return;
    }

    // Fallback if window is not available
    openDocumentFile(rawUrl, fileName);
  } catch (e) {
    console.error('Failed to open attachment:', e);
  }
};
