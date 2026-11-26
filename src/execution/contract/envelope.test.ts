import { describe, expect, test } from "vitest";
import { FAILURE_CODES } from "@/domain/errors/failure-codes";
import { PROXY_FAILURE_STATUS, PROXY_SUCCESS_STATUS } from "./envelope";

describe("proxy statuses", () => {
  test("success uses 200, which no failure status shares", () => {
    expect(PROXY_SUCCESS_STATUS).toBe(200);
    for (const code of FAILURE_CODES) {
      expect(PROXY_FAILURE_STATUS[code]).not.toBe(PROXY_SUCCESS_STATUS);
    }
  });

  test("every failure maps to a 4xx or 5xx status", () => {
    for (const code of FAILURE_CODES) {
      expect(PROXY_FAILURE_STATUS[code]).toBeGreaterThanOrEqual(400);
      expect(PROXY_FAILURE_STATUS[code]).toBeLessThan(600);
    }
  });

  test("matches the table in API_INTEGRATION.md §6.2", () => {
    expect(PROXY_FAILURE_STATUS).toMatchObject({
      INVALID_REQUEST: 400,
      FORBIDDEN_ORIGIN: 403,
      DESTINATION_BLOCKED: 403,
      TIMEOUT: 504,
      UPSTREAM_UNREACHABLE: 502,
      RESPONSE_TOO_LARGE: 502,
      TOO_MANY_REDIRECTS: 502,
      INTERNAL_ERROR: 500,
    });
  });

  test("client-only failures map to 500 if the proxy ever sends them", () => {
    expect(PROXY_FAILURE_STATUS.NETWORK_ERROR).toBe(500);
    expect(PROXY_FAILURE_STATUS.CANCELLED).toBe(500);
  });
});
