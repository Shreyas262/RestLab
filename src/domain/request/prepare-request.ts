import { CONTENT_TYPE_FOR_BODY, sendsBody } from "./body-rules";
import { buildFinalUrl } from "./build-url";
import type { HttpMethod, RequestConfig } from "./schema";

/** Exactly what an executor sends. Built only from a request that passed `requestSchema`. */
export interface PreparedRequest {
  url: string;
  method: HttpMethod;
  headers: [name: string, value: string][];
  body: string | null;
}

export function prepareRequest(request: RequestConfig): PreparedRequest {
  const url = buildFinalUrl(request.url, request.params);
  if (url === null) {
    throw new Error(
      "prepareRequest requires a request that passed validation.",
    );
  }

  const headers: [string, string][] = request.headers
    .filter((row) => row.enabled && row.key.trim() !== "")
    .map((row) => [row.key.trim(), row.value]);

  const withBody = sendsBody(request.method, request.body);
  if (withBody && request.body.type !== "none") {
    const hasContentType = headers.some(
      ([name]) => name.toLowerCase() === "content-type",
    );
    if (!hasContentType) {
      headers.push(["Content-Type", CONTENT_TYPE_FOR_BODY[request.body.type]]);
    }
  }

  return {
    url,
    method: request.method,
    headers,
    body: withBody ? request.body.content : null,
  };
}
