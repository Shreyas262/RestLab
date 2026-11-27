import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { createProcessingError } from "@/domain/errors/processing-errors";
import { FORMAT_LIMIT_BYTES } from "@/domain/response/display";
import { makeResponse } from "@/test/fixtures/responses";
import { BodyTab } from "./body-tab";

const body = () => screen.getByLabelText("Response body");

describe("BodyTab (FR-05, FR-06, NFR-04, NFR-05)", () => {
  test("formats and highlights JSON, keeping values as received", () => {
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "json",
          rawBody: '{"id":12345678901234567890,"ok":true}',
          parsedBody: { id: 12345678901234567890, ok: true },
          sizeBytes: 37,
        })}
      />,
    );

    expect(body().textContent).toBe(
      '{\n  "id": 12345678901234567890,\n  "ok": true\n}',
    );
    const key = body().querySelector('[data-token="key"]');
    expect(key?.textContent).toBe('"id"');
    expect(body().querySelector('[data-token="boolean"]')?.textContent).toBe(
      "true",
    );
  });

  test("shows JSON above the display limit as plain text with a note", () => {
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "json",
          rawBody: '{"a":1}',
          parsedBody: { a: 1 },
          sizeBytes: FORMAT_LIMIT_BYTES + 1,
        })}
      />,
    );

    expect(body().textContent).toBe('{"a":1}');
    expect(body().querySelector("[data-token]")).toBeNull();
    expect(screen.getByText(/larger than 256 KB/)).toBeDefined();
  });

  test("shows malformed JSON as raw text with the processing error", () => {
    const error = createProcessingError("JSON_PARSE_ERROR");
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "json",
          rawBody: '{"a":',
          processingError: error,
          sizeBytes: 5,
        })}
      />,
    );

    expect(body().textContent).toBe('{"a":');
    expect(screen.getByText(error.message)).toBeDefined();
  });

  test("shows HTML as text and never injects it", () => {
    const html = '<img src="x" onerror="alert(1)"><b>bold</b>';
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "text",
          contentType: "text/html",
          rawBody: html,
          sizeBytes: html.length,
        })}
      />,
    );

    expect(body().textContent).toBe(html);
    expect(body().querySelector("img, b")).toBeNull();
  });

  test("shows an explicit empty state", () => {
    render(<BodyTab response={makeResponse({ bodyClass: "empty" })} />);

    expect(screen.getByText("The response has no body.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
  });

  test("does not display binary content", () => {
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "binary",
          contentType: "application/zip",
          sizeBytes: 2048,
        })}
      />,
    );

    expect(screen.getByText(/Binary content is not displayed/)).toBeDefined();
    expect(screen.getByText("application/zip · 2 KB")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();
  });

  test("explains a body that could not be decoded", () => {
    const error = createProcessingError("DECODE_ERROR");
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "text",
          processingError: error,
          sizeBytes: 3,
        })}
      />,
    );

    expect(screen.getByText(error.message)).toBeDefined();
  });

  test("copies the formatted JSON that is shown", async () => {
    const user = userEvent.setup();
    render(
      <BodyTab
        response={makeResponse({
          bodyClass: "json",
          rawBody: '{"a":[1]}',
          parsedBody: { a: [1] },
          sizeBytes: 9,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await navigator.clipboard.readText()).toBe(
      '{\n  "a": [\n    1\n  ]\n}',
    );
  });
});
