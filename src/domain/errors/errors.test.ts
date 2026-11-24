import { describe, expect, test } from "vitest";
import {
  createFailure,
  FAILURE_CODES,
  FAILURE_MESSAGES,
  isFailureCode,
} from "./failure-codes";
import {
  createProcessingError,
  PROCESSING_ERROR_CODES,
  PROCESSING_ERROR_MESSAGES,
} from "./processing-errors";

describe("failure codes", () => {
  test("contains the shared set from API_INTEGRATION.md §5", () => {
    expect([...FAILURE_CODES].sort()).toEqual(
      [
        "CANCELLED",
        "DESTINATION_BLOCKED",
        "FORBIDDEN_ORIGIN",
        "INTERNAL_ERROR",
        "INVALID_REQUEST",
        "NETWORK_ERROR",
        "RESPONSE_TOO_LARGE",
        "TIMEOUT",
        "TOO_MANY_REDIRECTS",
        "UPSTREAM_UNREACHABLE",
      ].sort(),
    );
  });

  test("every code has a non-empty message", () => {
    for (const code of FAILURE_CODES) {
      expect(FAILURE_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  test("createFailure pairs a code with its message", () => {
    expect(createFailure("TIMEOUT")).toEqual({
      code: "TIMEOUT",
      message: FAILURE_MESSAGES.TIMEOUT,
    });
  });

  test("isFailureCode accepts known codes and rejects anything else", () => {
    expect(isFailureCode("NETWORK_ERROR")).toBe(true);
    expect(isFailureCode("network_error")).toBe(false);
    expect(isFailureCode("JSON_PARSE_ERROR")).toBe(false);
    expect(isFailureCode(42)).toBe(false);
    expect(isFailureCode(undefined)).toBe(false);
  });
});

describe("processing errors", () => {
  test("are distinct from failure codes", () => {
    for (const code of PROCESSING_ERROR_CODES) {
      expect(isFailureCode(code)).toBe(false);
    }
  });

  test("every code has a non-empty message", () => {
    for (const code of PROCESSING_ERROR_CODES) {
      expect(PROCESSING_ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  test("createProcessingError pairs a code with its message", () => {
    expect(createProcessingError("JSON_PARSE_ERROR")).toEqual({
      code: "JSON_PARSE_ERROR",
      message: PROCESSING_ERROR_MESSAGES.JSON_PARSE_ERROR,
    });
  });
});
