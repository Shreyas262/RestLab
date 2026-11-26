import type { Failure, FailureCode } from "@/domain/errors/failure-codes";
import type { NormalizedResponse } from "@/domain/response/model";

/** Body of every `/api/execute` reply (ADR-009, API_INTEGRATION.md §6.2). */
export type ProxyEnvelope =
  { ok: true; response: NormalizedResponse } | { ok: false; error: Failure };

export type ProxySuccessEnvelope = Extract<ProxyEnvelope, { ok: true }>;
export type ProxyFailureEnvelope = Extract<ProxyEnvelope, { ok: false }>;

/** Upstream 4xx and 5xx still travel in a success envelope with this status. */
export const PROXY_SUCCESS_STATUS = 200;

/**
 * `NETWORK_ERROR` and `CANCELLED` arise only in the client, so the proxy should
 * never send them; if it does, that is a server bug and maps to 500.
 */
export const PROXY_FAILURE_STATUS: Readonly<Record<FailureCode, number>> = {
  INVALID_REQUEST: 400,
  FORBIDDEN_ORIGIN: 403,
  DESTINATION_BLOCKED: 403,
  TIMEOUT: 504,
  UPSTREAM_UNREACHABLE: 502,
  RESPONSE_TOO_LARGE: 502,
  TOO_MANY_REDIRECTS: 502,
  INTERNAL_ERROR: 500,
  NETWORK_ERROR: 500,
  CANCELLED: 500,
};

/** 415 is used instead of the default 400 for a wrong `Content-Type` (API_INTEGRATION.md §6.3). */
export const PROXY_UNSUPPORTED_MEDIA_TYPE_STATUS = 415;
