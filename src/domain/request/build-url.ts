import type { KeyValueRow } from "./schema";
import { checkUrl } from "./url-rules";

/**
 * Appends enabled, non-empty-key parameter rows to the URL's existing query string.
 * Returns null when the URL itself is not acceptable, so the editor preview can show nothing.
 */
export function buildFinalUrl(
  url: string,
  params: readonly KeyValueRow[],
): string | null {
  if (checkUrl(url) !== null) return null;

  const target = new URL(url);
  // encodeURIComponent rather than URLSearchParams, so spaces become %20 instead of +.
  const added = params
    .filter((row) => row.enabled && row.key !== "")
    .map(
      (row) =>
        `${encodeURIComponent(row.key)}=${encodeURIComponent(row.value)}`,
    );

  if (added.length > 0) {
    const existing = target.search.slice(1);
    target.search = [existing, ...added].filter(Boolean).join("&");
  }
  return target.href;
}
