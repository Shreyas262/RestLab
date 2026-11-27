import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { makeResponse } from "@/test/fixtures/responses";
import { OverviewTab } from "./overview-tab";

const overview = () => screen.getByLabelText("Normalized response");

describe("OverviewTab (FR-05)", () => {
  test("shows the summary and the normalized response as highlighted JSON", () => {
    const response = makeResponse({
      bodyClass: "json",
      contentType: "application/json",
      rawBody: '{"a":1}',
      parsedBody: { a: 1 },
      sizeBytes: 7,
    });
    render(<OverviewTab response={response} />);

    expect(screen.getByText("Success:")).toBeDefined();
    const shown = JSON.parse(overview().textContent ?? "") as unknown;
    expect(shown).toMatchObject({ status: 200, rawBody: '{"a":1}' });
    expect(shown).not.toHaveProperty("parsedBody");
    expect(overview().querySelector('[data-token="key"]')).not.toBeNull();
  });

  test("replaces image data with a placeholder", () => {
    render(
      <OverviewTab
        response={makeResponse({
          bodyClass: "image",
          contentType: "image/png",
          imageBase64: "A".repeat(4096),
          sizeBytes: 3072,
        })}
      />,
    );

    expect(overview().textContent).toContain(
      "<4 KB of base64 image data, shown in the Body tab>",
    );
    expect(overview().textContent).not.toContain("AAAA");
  });
});
