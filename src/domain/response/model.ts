import type { ProcessingError } from "../errors/processing-errors";
import type { ExecutionStrategy } from "../request/schema";

export const BODY_CLASSES = ["json", "text", "binary", "empty"] as const;
export type BodyClass = (typeof BODY_CLASSES)[number];

export interface ResponseHeader {
  name: string;
  value: string;
}

/** The application's response representation, identical for both strategies (ADR-007, API_INTEGRATION.md §4.2). */
export interface NormalizedResponse {
  status: number;
  /** Empty when the server sent no reason phrase, as with HTTP/2 and HTTP/3. */
  statusText: string;
  /** Lowercased names, sorted by name; entries with the same name keep their order. */
  headers: ResponseHeader[];
  durationMs: number;
  /** Decoded body bytes read (ADR-014). */
  sizeBytes: number;
  /** `Content-Type` exactly as received, or `null` when absent. */
  contentType: string | null;
  bodyClass: BodyClass;
  /** Absent for binary and empty bodies, and when the declared charset is unknown. */
  rawBody?: string;
  /** Present only when JSON parsing succeeded. */
  parsedBody?: unknown;
  processingError?: ProcessingError;
  strategy: ExecutionStrategy;
}
