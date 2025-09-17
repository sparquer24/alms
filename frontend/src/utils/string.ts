// Filename and string helpers

/**
 * Truncate a filename by keeping the first N characters of the basename,
 * appending ellipsis, and preserving the extension. Example:
 *  groundreport.pdf -> groundrep...pdf (with keep=10)
 */
export function truncateFilename(filename: string, keep: number = 10): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  const hasExt = lastDot > 0 && lastDot < filename.length - 1;
  const base = hasExt ? filename.slice(0, lastDot) : filename;
  const extNoDot = hasExt ? filename.slice(lastDot + 1) : '';

  if (base.length <= keep) return filename;
  const visible = base.slice(0, keep);
  return `${visible}...${extNoDot}`;
}

/** Simple guard-safe accessor */
export const safe = <T>(val: T | undefined | null, fallback: T): T => (val == null ? fallback : val);
