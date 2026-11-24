import type { KeyValueRow, RequestConfig } from "@/domain/request/schema";

export function makeRequest(
  overrides: Partial<RequestConfig> = {},
): RequestConfig {
  return {
    url: "https://api.example.com/items",
    method: "GET",
    params: [],
    headers: [],
    body: { type: "none", content: "" },
    strategy: "browser",
    ...overrides,
  };
}

export function row(key: string, value: string, enabled = true): KeyValueRow {
  return { key, value, enabled };
}
