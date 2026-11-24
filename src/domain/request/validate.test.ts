import { describe, expect, test } from "vitest";
import { makeRequest, row } from "@/test/fixtures/requests";
import { validateRequest } from "./validate";

function issuesFor(input: unknown) {
  const result = validateRequest(input);
  return result.ok ? [] : result.issues;
}

function pathsFor(input: unknown) {
  return issuesFor(input).map((issue) => issue.path);
}

describe("validateRequest: URL", () => {
  test("accepts http and https URLs", () => {
    expect(
      validateRequest(makeRequest({ url: "https://example.com" })).ok,
    ).toBe(true);
    expect(
      validateRequest(makeRequest({ url: "http://localhost:3000/a?b=1" })).ok,
    ).toBe(true);
  });

  test.each([
    ["empty", ""],
    ["whitespace only", "   "],
    ["relative path", "/items"],
    ["no scheme", "example.com/items"],
    ["not a URL", "not a url"],
  ])("rejects a %s URL", (_label, url) => {
    expect(pathsFor(makeRequest({ url }))).toEqual(["url"]);
  });

  test.each([
    ["ftp", "ftp://example.com/file"],
    ["file", "file:///etc/passwd"],
    ["javascript", "javascript:alert(1)"],
    ["data", "data:text/plain,hi"],
  ])("rejects the %s scheme", (_label, url) => {
    const issues = issuesFor(makeRequest({ url }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      path: "url",
      message: expect.stringContaining("http"),
    });
  });

  test.each([
    ["user and password", "https://user:pass@example.com"],
    ["user only", "https://user@example.com"],
    ["password only", "https://:pass@example.com"],
  ])("rejects credentials in the URL (%s)", (_label, url) => {
    const issues = issuesFor(makeRequest({ url }));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("username or password");
  });
});

describe("validateRequest: headers", () => {
  test("accepts valid header names", () => {
    const request = makeRequest({
      headers: [
        row("Authorization", "Bearer x"),
        row("X-Custom_Header.1", "v"),
        row("accept", "*/*"),
      ],
    });
    expect(validateRequest(request).ok).toBe(true);
  });

  test.each([
    ["a space", "X Custom"],
    ["a colon", "X-Custom:"],
    ["non-ASCII", "X-Ünicode"],
    ["brackets", "X-[a]"],
  ])("rejects a header name containing %s", (_label, name) => {
    expect(
      pathsFor(makeRequest({ headers: [row("Accept", "x"), row(name, "v")] })),
    ).toEqual(["headers.1.key"]);
  });

  test("rejects header values with line breaks or null characters", () => {
    const request = makeRequest({
      headers: [
        row("X-A", "line\r\nInjected: yes"),
        row("X-B", "nul\0"),
        row("X-C", "fine"),
      ],
    });
    expect(pathsFor(request)).toEqual(["headers.0.value", "headers.1.value"]);
  });

  test("ignores disabled rows and rows with an empty name", () => {
    const request = makeRequest({
      headers: [
        row("Bad Name", "v", false),
        row("", "orphan value"),
        row("   ", "x"),
      ],
    });
    expect(validateRequest(request).ok).toBe(true);
  });

  test("trims surrounding whitespace from header names before checking them", () => {
    expect(
      validateRequest(makeRequest({ headers: [row("  Accept  ", "x")] })).ok,
    ).toBe(true);
  });
});

describe("validateRequest: parameters", () => {
  test("allows duplicate keys and any characters in keys and values", () => {
    const request = makeRequest({
      params: [
        row("tag", "a"),
        row("tag", "b"),
        row("q", "hello world & more"),
        row("", "ignored"),
      ],
    });
    expect(validateRequest(request).ok).toBe(true);
  });
});

describe("validateRequest: body", () => {
  test("accepts valid JSON for methods that send a body", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"] as const) {
      const request = makeRequest({
        method,
        body: { type: "json", content: '{"a":[1,2,{"b":null}]}' },
      });
      expect(validateRequest(request).ok).toBe(true);
    }
  });

  test.each([
    ["malformed", '{"a":'],
    ["empty", ""],
    ["trailing comma", '{"a":1,}'],
    ["single quotes", "{'a':1}"],
  ])("rejects %s JSON", (_label, content) => {
    const issues = issuesFor(
      makeRequest({ method: "POST", body: { type: "json", content } }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      path: "body.content",
      message: expect.stringContaining("not valid JSON"),
    });
  });

  test("does not check JSON for GET, because GET never sends a body (ADR-017)", () => {
    const request = makeRequest({
      method: "GET",
      body: { type: "json", content: "{not json" },
    });
    expect(validateRequest(request).ok).toBe(true);
  });

  test("does not check JSON when the body type is none or text", () => {
    expect(
      validateRequest(
        makeRequest({ method: "POST", body: { type: "none", content: "{" } }),
      ).ok,
    ).toBe(true);
    expect(
      validateRequest(
        makeRequest({ method: "POST", body: { type: "text", content: "{" } }),
      ).ok,
    ).toBe(true);
  });

  test("accepts an optional DELETE body", () => {
    expect(
      validateRequest(
        makeRequest({ method: "DELETE", body: { type: "text", content: "x" } }),
      ).ok,
    ).toBe(true);
    expect(validateRequest(makeRequest({ method: "DELETE" })).ok).toBe(true);
  });
});

describe("validateRequest: untrusted input", () => {
  test.each([
    ["null", null],
    ["a string", "https://example.com"],
    ["an unknown method", { ...makeRequest(), method: "TRACE" }],
    [
      "an unknown body type",
      { ...makeRequest(), body: { type: "xml", content: "" } },
    ],
    ["an unknown strategy", { ...makeRequest(), strategy: "server" }],
    ["rows of the wrong shape", { ...makeRequest(), headers: [{ key: "a" }] }],
  ])("rejects %s", (_label, input) => {
    expect(validateRequest(input).ok).toBe(false);
  });

  test("reports every problem at once with dotted paths", () => {
    const request = makeRequest({
      url: "ftp://x",
      method: "POST",
      headers: [row("ok", "v"), row("bad name", "v")],
      body: { type: "json", content: "{" },
    });
    expect(pathsFor(request)).toEqual(["url", "headers.1.key", "body.content"]);
  });

  test("returns the parsed request on success", () => {
    const request = makeRequest({ params: [row("a", "1")] });
    expect(validateRequest(request)).toEqual({ ok: true, request });
  });
});
