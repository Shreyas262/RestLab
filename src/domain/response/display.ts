/** OD-6: above this decoded body size, JSON is shown as plain text without formatting or highlighting (ADR-023). */
export const FORMAT_LIMIT_BYTES = 256 * 1024;

export function isWithinFormatLimit(sizeBytes: number): boolean {
  return sizeBytes <= FORMAT_LIMIT_BYTES;
}
