export const FAILURE_CODES = [
  "NETWORK_ERROR",
  "TIMEOUT",
  "CANCELLED",
  "RESPONSE_TOO_LARGE",
  "INVALID_REQUEST",
  "FORBIDDEN_ORIGIN",
  "DESTINATION_BLOCKED",
  "UPSTREAM_UNREACHABLE",
  "TOO_MANY_REDIRECTS",
  "INTERNAL_ERROR",
] as const;

export type FailureCode = (typeof FAILURE_CODES)[number];

export interface Failure {
  code: FailureCode;
  message: string;
}

// User-facing text. Must never include addresses, hostnames, or stack traces (API_INTEGRATION.md §6.2).
export const FAILURE_MESSAGES: Readonly<Record<FailureCode, string>> = {
  NETWORK_ERROR:
    "The request could not reach the server. It may be offline, unreachable, or blocked by CORS.",
  TIMEOUT: "The request timed out before a response arrived.",
  CANCELLED: "Request cancelled.",
  RESPONSE_TOO_LARGE: "The response is larger than the size limit.",
  INVALID_REQUEST: "The proxy rejected the request as invalid.",
  FORBIDDEN_ORIGIN: "The proxy only accepts requests from RestLab itself.",
  DESTINATION_BLOCKED: "This destination is not allowed through the proxy.",
  UPSTREAM_UNREACHABLE: "The proxy could not connect to the destination.",
  TOO_MANY_REDIRECTS: "The destination redirected too many times.",
  INTERNAL_ERROR: "Something went wrong while running the request.",
};

export function createFailure(code: FailureCode): Failure {
  return { code, message: FAILURE_MESSAGES[code] };
}

export function isFailureCode(value: unknown): value is FailureCode {
  return (
    typeof value === "string" &&
    (FAILURE_CODES as readonly string[]).includes(value)
  );
}
