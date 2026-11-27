import { describe, expect, test } from "vitest";
import { createProcessingError } from "../errors/processing-errors";
import { base64ToBytes } from "./base64";
import { normalizeResponse, type ReceivedResponse } from "./normalize-response";

const utf8 = (text: string) => new TextEncoder().encode(text);

function received(overrides: Partial<ReceivedResponse> = {}): ReceivedResponse {
  return {
    status: 200,
    statusText: "OK",
    headers: [],
    bytes: new Uint8Array(),
    durationMs: 12,
    strategy: "browser",
    ...overrides,
  };
}

describe("normalizeResponse (FR-05, FR-06, NFR-04)", () => {
  test("parses a JSON body and keeps the raw text", () => {
    const raw = '{"id":1,"tags":["a"]}';
    const response = normalizeResponse(
      received({
        headers: [["Content-Type", "application/json; charset=utf-8"]],
        bytes: utf8(raw),
      }),
    );
    expect(response).toEqual({
      status: 200,
      statusText: "OK",
      headers: [
        { name: "content-type", value: "application/json; charset=utf-8" },
      ],
      durationMs: 12,
      sizeBytes: raw.length,
      contentType: "application/json; charset=utf-8",
      bodyClass: "json",
      rawBody: raw,
      parsedBody: { id: 1, tags: ["a"] },
      strategy: "browser",
    });
  });

  test("treats +json types as JSON", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "application/problem+json"]],
        bytes: utf8('{"title":"Not Found"}'),
      }),
    );
    expect(response.bodyClass).toBe("json");
    expect(response.parsedBody).toEqual({ title: "Not Found" });
  });

  test("keeps a parsed JSON null as a parsed body", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "application/json"]],
        bytes: utf8("null"),
      }),
    );
    expect(response).toHaveProperty("parsedBody", null);
  });

  test("keeps the raw body and metadata when JSON is malformed", () => {
    const raw = '{"id":1,';
    const response = normalizeResponse(
      received({
        status: 500,
        statusText: "Internal Server Error",
        headers: [
          ["content-type", "application/json"],
          ["x-request-id", "abc"],
        ],
        bytes: utf8(raw),
      }),
    );
    expect(response.status).toBe(500);
    expect(response.bodyClass).toBe("json");
    expect(response.rawBody).toBe(raw);
    expect(response.sizeBytes).toBe(raw.length);
    expect(response).not.toHaveProperty("parsedBody");
    expect(response.processingError).toEqual(
      createProcessingError("JSON_PARSE_ERROR"),
    );
    expect(response.headers).toContainEqual({
      name: "x-request-id",
      value: "abc",
    });
  });

  test("shows text types as text without parsing", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "text/plain"]],
        bytes: utf8('{"looks":"like json"}'),
      }),
    );
    expect(response.bodyClass).toBe("text");
    expect(response.rawBody).toBe('{"looks":"like json"}');
    expect(response).not.toHaveProperty("parsedBody");
    expect(response).not.toHaveProperty("processingError");
  });

  test("treats HTML as text", () => {
    const html = "<h1>Hello</h1><script>alert(1)</script>";
    const response = normalizeResponse(
      received({
        headers: [["content-type", "text/html; charset=utf-8"]],
        bytes: utf8(html),
      }),
    );
    expect(response.bodyClass).toBe("text");
    expect(response.rawBody).toBe(html);
  });

  test("decodes with the declared charset and counts bytes, not characters", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "text/plain; charset=iso-8859-1"]],
        bytes: new Uint8Array([0x63, 0x61, 0x66, 0xe9]),
      }),
    );
    expect(response.rawBody).toBe("café");
    expect(response.sizeBytes).toBe(4);

    const utf8Response = normalizeResponse(
      received({
        headers: [["content-type", "text/plain"]],
        bytes: utf8("café"),
      }),
    );
    expect(utf8Response.rawBody).toBe("café");
    expect(utf8Response.sizeBytes).toBe(5);
  });

  test("returns DECODE_ERROR without a raw body when the declared charset is unknown", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "application/json; charset=x-unknown"]],
        bytes: utf8("{}"),
      }),
    );
    expect(response.bodyClass).toBe("json");
    expect(response).not.toHaveProperty("rawBody");
    expect(response).not.toHaveProperty("parsedBody");
    expect(response.processingError).toEqual(
      createProcessingError("DECODE_ERROR"),
    );
    expect(response.sizeBytes).toBe(2);
  });

  test("replaces invalid bytes in a declared text body instead of failing", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "text/plain; charset=utf-8"]],
        bytes: new Uint8Array([0x68, 0xff, 0x69]),
      }),
    );
    expect(response.bodyClass).toBe("text");
    expect(response.rawBody).toBe("h�i");
    expect(response.sizeBytes).toBe(3);
    expect(response).not.toHaveProperty("processingError");
  });

  test("parses JSON whose invalid bytes sit inside a string", () => {
    const bytes = new Uint8Array([...utf8('{"a":"x'), 0xff, ...utf8('"}')]);
    const response = normalizeResponse(
      received({ headers: [["content-type", "application/json"]], bytes }),
    );
    expect(response.parsedBody).toEqual({ a: "x�" });
    expect(response).not.toHaveProperty("processingError");
  });

  test("does not decode binary types", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "application/octet-stream"]],
        bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
      }),
    );
    expect(response.bodyClass).toBe("binary");
    expect(response.sizeBytes).toBe(4);
    expect(response).not.toHaveProperty("rawBody");
    expect(response).not.toHaveProperty("imageBase64");
    expect(response).not.toHaveProperty("processingError");
  });

  test("keeps image bytes as base64 without decoding them as text", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const response = normalizeResponse(
      received({ headers: [["content-type", "image/png"]], bytes }),
    );
    expect(response.bodyClass).toBe("image");
    expect(response.sizeBytes).toBe(6);
    expect(response.imageBase64).toBeDefined();
    expect(base64ToBytes(response.imageBase64 ?? "")).toEqual(bytes);
    expect(response).not.toHaveProperty("rawBody");
    expect(response).not.toHaveProperty("processingError");
  });

  test("keeps SVG as text, never as an image", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const response = normalizeResponse(
      received({
        headers: [["content-type", "image/svg+xml"]],
        bytes: utf8(svg),
      }),
    );
    expect(response.bodyClass).toBe("text");
    expect(response.rawBody).toBe(svg);
    expect(response).not.toHaveProperty("imageBase64");
  });

  test("classifies an empty image body as empty", () => {
    const response = normalizeResponse(
      received({ headers: [["content-type", "image/png"]] }),
    );
    expect(response.bodyClass).toBe("empty");
    expect(response).not.toHaveProperty("imageBase64");
  });

  test("classifies a zero-length body as empty whatever the content type says", () => {
    const response = normalizeResponse(
      received({
        status: 204,
        statusText: "No Content",
        headers: [["content-type", "application/json"]],
      }),
    );
    expect(response.bodyClass).toBe("empty");
    expect(response.sizeBytes).toBe(0);
    expect(response).not.toHaveProperty("rawBody");
    expect(response).not.toHaveProperty("processingError");
  });

  describe("missing content type", () => {
    test("is text when the body decodes cleanly as UTF-8", () => {
      const response = normalizeResponse(received({ bytes: utf8("plain") }));
      expect(response.contentType).toBeNull();
      expect(response.bodyClass).toBe("text");
      expect(response.rawBody).toBe("plain");
    });

    test("is binary when the body does not decode cleanly", () => {
      const response = normalizeResponse(
        received({ bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) }),
      );
      expect(response.bodyClass).toBe("binary");
      expect(response).not.toHaveProperty("rawBody");
      expect(response).not.toHaveProperty("processingError");
    });

    test("applies to a malformed content type too, which is still stored as received", () => {
      const response = normalizeResponse(
        received({
          headers: [["content-type", "garbage"]],
          bytes: utf8("hello"),
        }),
      );
      expect(response.contentType).toBe("garbage");
      expect(response.bodyClass).toBe("text");
    });
  });

  test.each([
    [404, "Not Found"],
    [500, "Internal Server Error"],
  ])(
    "keeps an HTTP %i as a normal response with its body",
    (status, statusText) => {
      const response = normalizeResponse(
        received({
          status,
          statusText,
          headers: [["content-type", "application/json"]],
          bytes: utf8('{"error":"nope"}'),
        }),
      );
      expect(response.status).toBe(status);
      expect(response.statusText).toBe(statusText);
      expect(response.parsedBody).toEqual({ error: "nope" });
      expect(response).not.toHaveProperty("processingError");
    },
  );

  test("keeps an empty status text", () => {
    expect(normalizeResponse(received({ statusText: "" })).statusText).toBe("");
  });

  test("lowercases and sorts headers, keeping the order of repeated names", () => {
    const response = normalizeResponse(
      received({
        strategy: "proxy",
        headers: [
          ["X-Trace", "t"],
          ["Set-Cookie", "a=1"],
          ["Cache-Control", "no-store"],
          ["Set-Cookie", "b=2"],
        ],
      }),
    );
    expect(response.headers).toEqual([
      { name: "cache-control", value: "no-store" },
      { name: "set-cookie", value: "a=1" },
      { name: "set-cookie", value: "b=2" },
      { name: "x-trace", value: "t" },
    ]);
    expect(response.strategy).toBe("proxy");
  });

  test("is JSON-serializable without loss", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "application/json"]],
        bytes: utf8('{"a":[1,"b",null]}'),
      }),
    );
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  test("is JSON-serializable without loss for an image body", () => {
    const response = normalizeResponse(
      received({
        headers: [["content-type", "image/gif"]],
        bytes: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0xff]),
      }),
    );
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });
});
