/**
 * Shared client-side checks for files picked in upload fields, so every form
 * rejects oversized/empty files before calling the API and shows the same message.
 */

export const MB = 1024 * 1024;

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${parseFloat((bytes / 1024).toFixed(1))} KB`;
  return `${parseFloat((bytes / MB).toFixed(2))} MB`;
};

/** Returns a user-facing error for the file, or null when it is within limits. */
export const getFileSizeError = (
  file: File,
  maxBytes: number,
  { minBytes = 1 }: { minBytes?: number } = {}
): string | null => {
  if (file.size === 0) {
    return `"${file.name}" is empty. Please choose a valid file.`;
  }
  if (file.size < minBytes) {
    return `"${file.name}" is only ${formatFileSize(file.size)}. The minimum allowed size is ${formatFileSize(minBytes)}.`;
  }
  if (file.size > maxBytes) {
    return `"${file.name}" is ${formatFileSize(file.size)}. The maximum allowed size is ${formatFileSize(maxBytes)} — please choose a smaller or compressed file.`;
  }
  return null;
};
