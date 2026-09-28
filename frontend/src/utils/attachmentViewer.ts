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

    // Delegate to the authenticated file handler
    openDocumentFile(rawUrl, fileName);
  } catch (e) {
    console.error('Failed to open attachment:', e);
  }
};
