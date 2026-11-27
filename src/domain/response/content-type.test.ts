import { describe, expect, test } from "vitest";
import { classifyMediaType, parseContentType } from "./content-type";

describe("parseContentType (FR-05)", () => {
  test("returns null when the header is missing", () => {
    expect(parseContentType(null)).toBeNull();
  });

  test("lowercases the essence and reads the charset", () => {
    expect(parseContentType("Application/JSON; Charset=UTF-8")).toEqual({
      essence: "application/json",
      charset: "utf-8",
    });
  });

  test("has a null charset when none is given", () => {
    expect(parseContentType("text/plain")).toEqual({
      essence: "text/plain",
      charset: null,
    });
  });

  test("unquotes a quoted charset and skips other parameters", () => {
    expect(
      parseContentType('text/html; boundary=x; charset="ISO-8859-1"'),
    ).toEqual({ essence: "text/html", charset: "iso-8859-1" });
  });

  test("ignores an empty charset", () => {
    expect(parseContentType("text/plain; charset=")?.charset).toBeNull();
  });

  test.each(["", "json", "text/", "/plain", "a/b, c/d", "text plain"])(
    "returns null for the malformed value %j",
    (value) => {
      expect(parseContentType(value)).toBeNull();
    },
  );
});

describe("classifyMediaType (FR-05)", () => {
  test.each([
    ["application/json", "json"],
    ["application/problem+json", "json"],
    ["application/vnd.api+json", "json"],
    ["text/plain", "text"],
    ["text/html", "text"],
    ["text/csv", "text"],
    ["application/xml", "text"],
    ["application/atom+xml", "text"],
    ["image/svg+xml", "text"],
    ["application/javascript", "text"],
    ["application/x-www-form-urlencoded", "text"],
    ["application/x-ndjson", "text"],
    ["image/png", "binary"],
    ["application/octet-stream", "binary"],
    ["application/zip", "binary"],
    ["application/pdf", "binary"],
    ["application/x-unknown", "binary"],
  ])("classifies %s as %s", (essence, expected) => {
    expect(classifyMediaType(essence)).toBe(expected);
  });
});
