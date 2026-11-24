import type { HttpMethod, RequestBody } from "./schema";

/** GET never sends a body; text kept in the editor is ignored (ADR-017). */
export function sendsBody(method: HttpMethod, body: RequestBody): boolean {
  return method !== "GET" && body.type !== "none";
}

export const CONTENT_TYPE_FOR_BODY = {
  json: "application/json",
  text: "text/plain",
} as const;
