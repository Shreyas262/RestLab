import type { FailureCode } from "@/domain/errors/failure-codes";
import { prepareRequest } from "@/domain/request/prepare-request";
import { normalizeResponse } from "@/domain/response/normalize-response";
import type { Executor } from "./contract/executor";
import { failureResult, responseResult } from "./contract/result";
import { MAX_RESPONSE_BYTES, REQUEST_TIMEOUT_MS } from "./limits";

const TOO_LARGE = Symbol("too large");

/**
 * Calls the destination directly with Fetch (API_INTEGRATION.md §3, §4).
 * Cancellation and the timeout are combined by hand rather than with
 * `AbortSignal.any`, which is newer than the browsers Next.js 16 targets.
 */
export const executeInBrowser: Executor = async (request, signal) => {
  if (signal.aborted) return failureResult("CANCELLED", "browser");

  const prepared = prepareRequest(request);
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    if (controller.signal.aborted) return;
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCancel = () => controller.abort();
  signal.addEventListener("abort", onCancel, { once: true });

  const failedWith = (code: FailureCode) => failureResult(code, "browser");
  const interruption = (): FailureCode =>
    timedOut
      ? "TIMEOUT"
      : controller.signal.aborted
        ? "CANCELLED"
        : "NETWORK_ERROR";

  try {
    const startedAt = performance.now();

    let response: Response;
    try {
      response = await fetch(prepared.url, {
        method: prepared.method,
        headers: prepared.headers,
        body: prepared.body,
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      return failedWith(interruption());
    }

    let bytes: Uint8Array | typeof TOO_LARGE;
    try {
      bytes = await readBody(response, MAX_RESPONSE_BYTES);
    } catch {
      return failedWith(interruption());
    }
    if (bytes === TOO_LARGE) return failedWith("RESPONSE_TOO_LARGE");

    const durationMs = performance.now() - startedAt;

    return responseResult(
      normalizeResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers.entries()),
        bytes,
        durationMs,
        strategy: "browser",
      }),
    );
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onCancel);
  }
};

/** Reads the body once, counting bytes as they arrive so an oversized body stops early. */
async function readBody(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array | typeof TOO_LARGE> {
  if (response.body === null) return new Uint8Array(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return TOO_LARGE;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
