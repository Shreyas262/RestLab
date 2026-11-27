import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { makeResponse } from "@/test/fixtures/responses";
import { MetadataTab } from "./metadata-tab";

const detail = (term: string) =>
  screen.getByText(term, { selector: "dt" }).nextElementSibling?.textContent;

describe("MetadataTab (FR-05)", () => {
  test("lists status, duration, size, content type, strategy, and outcome", () => {
    render(
      <MetadataTab
        response={makeResponse({
          status: 404,
          statusText: "Not Found",
          durationMs: 1500,
          sizeBytes: 1234,
          contentType: "application/json; charset=utf-8",
        })}
      />,
    );

    expect(detail("Status")).toBe("404");
    expect(detail("Status text")).toBe("Not Found");
    expect(detail("Duration (measured in the browser)")).toBe("1.50 s");
    expect(detail("Size (decoded body)")).toBe("1.2 KB (1,234 bytes)");
    expect(detail("Content type")).toBe("application/json; charset=utf-8");
    expect(detail("Strategy")).toBe("Browser-direct");
    expect(detail("Outcome")).toBe("HTTP error");
  });

  test("says when the status text or content type is not provided", () => {
    render(
      <MetadataTab
        response={makeResponse({ statusText: "", contentType: null })}
      />,
    );

    expect(detail("Status text")).toBe("Not provided");
    expect(detail("Content type")).toBe("Not provided");
  });

  test("shows headers in a table", () => {
    render(
      <MetadataTab
        response={makeResponse({
          headers: [
            { name: "content-type", value: "text/plain" },
            { name: "x-trace", value: "abc" },
          ],
        })}
      />,
    );

    const table = screen.getByRole("table", { name: "Response headers" });
    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      );
    expect(rows).toEqual([
      ["content-type", "text/plain"],
      ["x-trace", "abc"],
    ]);
  });

  test("notes the CORS header limit in browser-direct mode", () => {
    render(<MetadataTab response={makeResponse({ headers: [] })} />);

    expect(screen.getByText(/only show CORS-safelisted headers/)).toBeDefined();
    expect(screen.getByText("No response headers are visible.")).toBeDefined();
  });

  test("labels the proxy-measured duration and leaves out the CORS note", () => {
    render(<MetadataTab response={makeResponse({ strategy: "proxy" })} />);

    expect(detail("Duration (upstream, measured by the proxy)")).toBe("12 ms");
    expect(detail("Strategy")).toBe("Backend proxy");
    expect(screen.queryByText(/CORS-safelisted/)).toBeNull();
  });
});
