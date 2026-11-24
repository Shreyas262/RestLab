import type { KeyValueRow } from "./schema";

// MDN "Forbidden request header", checked 2026-11-25. Browsers silently drop these in fetch.
const FORBIDDEN_NAMES = new Set([
  "accept-charset",
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "date",
  "dnt",
  "expect",
  "host",
  "keep-alive",
  "origin",
  "referer",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "via",
]);
const FORBIDDEN_PREFIXES = ["proxy-", "sec-"];
const METHOD_OVERRIDE_NAMES = new Set([
  "x-http-method",
  "x-http-method-override",
  "x-method-override",
]);
const FORBIDDEN_METHODS = new Set(["CONNECT", "TRACE", "TRACK"]);

export function isForbiddenRequestHeader(name: string, value: string): boolean {
  const lower = name.trim().toLowerCase();
  if (FORBIDDEN_NAMES.has(lower)) return true;
  if (FORBIDDEN_PREFIXES.some((prefix) => lower.startsWith(prefix)))
    return true;
  if (METHOD_OVERRIDE_NAMES.has(lower)) {
    return value
      .split(",")
      .some((method) => FORBIDDEN_METHODS.has(method.trim().toUpperCase()));
  }
  return false;
}

export interface ForbiddenHeaderWarning {
  index: number;
  name: string;
}

/** Enabled header rows a browser will refuse to send. A warning for browser-direct, not a validation error. */
export function findForbiddenHeaders(
  headers: readonly KeyValueRow[],
): ForbiddenHeaderWarning[] {
  return headers.flatMap((row, index) =>
    row.enabled &&
    row.key.trim() !== "" &&
    isForbiddenRequestHeader(row.key, row.value)
      ? [{ index, name: row.key.trim() }]
      : [],
  );
}
