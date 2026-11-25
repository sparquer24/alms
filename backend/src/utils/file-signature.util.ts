/**
 * Detect true file type using magic bytes / file signatures.
 * Performs fast direct binary inspection for supported ALMS document formats
 * (PDF, JPEG, PNG, WebP) and falls back to file-type library.
 */
export async function detectFileType(
  buffer: Buffer,
): Promise<{ mime: string; ext: string } | null> {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF magic bytes: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  // JPEG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG magic bytes: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP magic bytes: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // Fallback to file-type via dynamic import
  try {
    const ft = await (eval('import("file-type")') as Promise<any>);
    if (ft && typeof ft.fileTypeFromBuffer === 'function') {
      const res = await ft.fileTypeFromBuffer(buffer);
      if (res) return { mime: res.mime, ext: res.ext };
    }
  } catch {
    // ignore dynamic import errors in testing environments
  }

  return null;
}
