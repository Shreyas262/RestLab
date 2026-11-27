import { describe, expect, test } from "vitest";
import { FORMAT_LIMIT_BYTES, isWithinFormatLimit } from "./display";

describe("isWithinFormatLimit (FR-05, NFR-03)", () => {
  test("the limit is 256 KB", () => {
    expect(FORMAT_LIMIT_BYTES).toBe(256 * 1024);
  });

  test("includes a body of exactly the limit and excludes one byte more", () => {
    expect(isWithinFormatLimit(FORMAT_LIMIT_BYTES)).toBe(true);
    expect(isWithinFormatLimit(FORMAT_LIMIT_BYTES + 1)).toBe(false);
  });

  test("includes an empty body", () => {
    expect(isWithinFormatLimit(0)).toBe(true);
  });
});
