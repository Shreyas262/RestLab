import { createProcessingError } from "../errors/processing-errors";
import type { ExecutionStrategy } from "../request/schema";
import { classifyMediaType, parseContentType } from "./content-type";
import { decodeText } from "./decode";
import type { NormalizedResponse, ResponseHeader } from "./model";
import { parseJson } from "./parse";

/** What an executor collects from a received response, before normalization. */
export interface ReceivedResponse {
  status: number;
  statusText: string;
  /** As the executor read them: repeated headers already combined, `Set-Cookie` one per entry where visible. */
  headers: readonly (readonly [name: string, value: string])[];
  /** The whole body, read once. */
  bytes: Uint8Array;
  durationMs: number;
  strategy: ExecutionStrategy;
}

export function normalizeResponse(
  received: ReceivedResponse,
): NormalizedResponse {
  const headers = normalizeHeaders(received.headers);
  const contentType =
    headers.find((header) => header.name === "content-type")?.value ?? null;

  const base = {
    status: received.status,
    statusText: received.statusText,
    headers,
    durationMs: received.durationMs,
    sizeBytes: received.bytes.length,
    contentType,
    strategy: received.strategy,
  };

  if (received.bytes.length === 0) {
    return { ...base, bodyClass: "empty" };
  }

  const mediaType = parseContentType(contentType);

  if (mediaType === null) {
    const sniffed = decodeText(received.bytes, null, { strict: true });
    return sniffed.ok
      ? { ...base, bodyClass: "text", rawBody: sniffed.text }
      : { ...base, bodyClass: "binary" };
  }

  const declared = classifyMediaType(mediaType.essence);
  if (declared === "binary") {
    return { ...base, bodyClass: "binary" };
  }

  const decoded = decodeText(received.bytes, mediaType.charset);
  if (!decoded.ok) {
    return {
      ...base,
      bodyClass: declared,
      processingError: createProcessingError("DECODE_ERROR"),
    };
  }

  if (declared === "text") {
    return { ...base, bodyClass: "text", rawBody: decoded.text };
  }

  const parsed = parseJson(decoded.text);
  return parsed.ok
    ? {
        ...base,
        bodyClass: "json",
        rawBody: decoded.text,
        parsedBody: parsed.value,
      }
    : {
        ...base,
        bodyClass: "json",
        rawBody: decoded.text,
        processingError: parsed.error,
      };
}

function normalizeHeaders(
  headers: ReceivedResponse["headers"],
): ResponseHeader[] {
  return headers
    .map(([name, value]) => ({ name: name.toLowerCase(), value }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
