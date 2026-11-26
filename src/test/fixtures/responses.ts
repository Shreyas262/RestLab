import type { NormalizedResponse } from "@/domain/response/model";

export function makeResponse(
  overrides: Partial<NormalizedResponse> = {},
): NormalizedResponse {
  return {
    status: 200,
    statusText: "OK",
    headers: [],
    durationMs: 12.4,
    sizeBytes: 0,
    contentType: null,
    bodyClass: "empty",
    strategy: "browser",
    ...overrides,
  };
}
