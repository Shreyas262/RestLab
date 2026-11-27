import { describe, expect, test } from "vitest";
import { createProcessingError } from "@/domain/errors/processing-errors";
import { FORMAT_LIMIT_BYTES } from "@/domain/response/display";
import { makeResponse } from "@/test/fixtures/responses";
import {
  bodyView,
  describeOutcome,
  formatBytes,
  formatDuration,
  OVER_LIMIT_NOTE,
  overviewValue,
  statusLabel,
} from "./response-view";

describe("response formatting helpers (FR-05)", () => {
  test.each([
    [0, "0 bytes"],
    [1, "1 byte"],
    [1023, "1023 bytes"],
    [1024, "1 KB"],
    [1229, "1.2 KB"],
    [15 * 1024, "15 KB"],
    [256 * 1024, "256 KB"],
    [5 * 1024 * 1024, "5 MB"],
  ])("formatBytes(%i) is %s", (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });

  test.each([
    [12.4, "12 ms"],
    [999.4, "999 ms"],
    [1500, "1.50 s"],
  ])("formatDuration(%d) is %s", (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });

  test("statusLabel leaves out an empty status text", () => {
    expect(statusLabel(makeResponse({ status: 200, statusText: "OK" }))).toBe(
      "200 OK",
    );
    expect(statusLabel(makeResponse({ status: 204, statusText: "" }))).toBe(
      "204",
    );
  });

  test.each([
    [200, "Success"],
    [204, "Success"],
    [304, "Redirect"],
    [404, "HTTP error"],
    [500, "HTTP error"],
    [101, "Response received"],
  ])("describeOutcome for %i is %s", (status, expected) => {
    expect(describeOutcome(makeResponse({ status }))).toBe(expected);
  });
});

describe("bodyView (FR-05, FR-06, NFR-04)", () => {
  test("formats JSON from the raw text, keeping large numbers", () => {
    const view = bodyView(
      makeResponse({
        bodyClass: "json",
        rawBody: '{"id":12345678901234567890}',
        parsedBody: { id: 12345678901234567890 },
        sizeBytes: 27,
      }),
    );
    expect(view).toMatchObject({
      kind: "json",
      text: '{\n  "id": 12345678901234567890\n}',
    });
  });

  test("shows JSON above the display limit as plain text with a note", () => {
    const view = bodyView(
      makeResponse({
        bodyClass: "json",
        rawBody: '{"a":1}',
        parsedBody: { a: 1 },
        sizeBytes: FORMAT_LIMIT_BYTES + 1,
      }),
    );
    expect(view).toEqual({
      kind: "text",
      text: '{"a":1}',
      note: OVER_LIMIT_NOTE,
    });
  });

  test("formats JSON of exactly the display limit", () => {
    const view = bodyView(
      makeResponse({
        bodyClass: "json",
        rawBody: "[]",
        parsedBody: [],
        sizeBytes: FORMAT_LIMIT_BYTES,
      }),
    );
    expect(view.kind).toBe("json");
  });

  test("shows malformed JSON as raw text with the processing error", () => {
    const error = createProcessingError("JSON_PARSE_ERROR");
    const view = bodyView(
      makeResponse({
        bodyClass: "json",
        rawBody: '{"a":',
        processingError: error,
        sizeBytes: 5,
      }),
    );
    expect(view).toEqual({ kind: "text", text: '{"a":', note: error.message });
  });

  test("shows text as text", () => {
    const view = bodyView(
      makeResponse({ bodyClass: "text", rawBody: "<b>hi</b>", sizeBytes: 9 }),
    );
    expect(view).toEqual({ kind: "text", text: "<b>hi</b>" });
  });

  test("reports a body that could not be decoded", () => {
    const error = createProcessingError("DECODE_ERROR");
    const view = bodyView(
      makeResponse({ bodyClass: "text", processingError: error, sizeBytes: 3 }),
    );
    expect(view).toEqual({ kind: "unreadable", message: error.message });
  });

  test("passes image data with the content type's essence", () => {
    const view = bodyView(
      makeResponse({
        bodyClass: "image",
        contentType: "image/PNG; foo=bar",
        imageBase64: "iVBORw==",
        sizeBytes: 4,
      }),
    );
    expect(view).toEqual({
      kind: "image",
      base64: "iVBORw==",
      mimeType: "image/png",
    });
  });

  test.each(["binary", "empty"] as const)("passes %s through", (bodyClass) => {
    expect(bodyView(makeResponse({ bodyClass }))).toEqual({ kind: bodyClass });
  });
});

describe("overviewValue (FR-05)", () => {
  test("leaves out the parsed body and keeps the raw body", () => {
    const value = overviewValue(
      makeResponse({
        bodyClass: "json",
        rawBody: '{"a":1}',
        parsedBody: { a: 1 },
      }),
    );
    expect(value).not.toHaveProperty("parsedBody");
    expect(value.rawBody).toBe('{"a":1}');
    expect(value.status).toBe(200);
  });

  test("replaces image data with a placeholder", () => {
    const value = overviewValue(
      makeResponse({ bodyClass: "image", imageBase64: "A".repeat(2048) }),
    );
    expect(value.imageBase64).toBe(
      "<2 KB of base64 image data, shown in the Body tab>",
    );
  });
});
