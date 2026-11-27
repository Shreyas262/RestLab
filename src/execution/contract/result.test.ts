import { describe, expect, test } from "vitest";
import {
  createFailure,
  FAILURE_CODES,
  FAILURE_MESSAGES,
} from "@/domain/errors/failure-codes";
import type { NormalizedResponse } from "@/domain/response/model";
import { failureResult, responseResult } from "./result";

const notFound: NormalizedResponse = {
  status: 404,
  statusText: "Not Found",
  headers: [{ name: "content-type", value: "application/json" }],
  durationMs: 12,
  sizeBytes: 2,
  contentType: "application/json",
  bodyClass: "json",
  rawBody: "{}",
  parsedBody: {},
  strategy: "browser",
};

describe("responseResult (FR-06)", () => {
  test("wraps an HTTP error status as a response, not a failure", () => {
    expect(responseResult(notFound)).toEqual({
      kind: "response",
      response: notFound,
    });
  });
});

describe("failureResult (FR-06)", () => {
  test("carries the failure code, its user-facing message, and the strategy", () => {
    expect(failureResult("TIMEOUT", "proxy")).toEqual({
      kind: "failure",
      failure: { code: "TIMEOUT", message: FAILURE_MESSAGES.TIMEOUT },
      strategy: "proxy",
    });
  });

  test("builds a failure for every shared code", () => {
    for (const code of FAILURE_CODES) {
      expect(failureResult(code, "browser").failure).toEqual(
        createFailure(code),
      );
    }
  });
});
