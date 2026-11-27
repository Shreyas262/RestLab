import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { createProcessingError } from "@/domain/errors/processing-errors";
import { failureResult, responseResult } from "@/execution/contract/result";
import { makeResponse } from "@/test/fixtures/responses";
import type { ExecutionState } from "../../hooks/use-execution";
import { ResponseInspector } from "./response-inspector";

const completed = (
  result: Extract<ExecutionState, { status: "completed" }>["result"],
): ExecutionState => ({ status: "completed", result });

describe("ResponseInspector (FR-05, FR-07)", () => {
  test("shows a prompt before anything is sent, without tabs", () => {
    render(<ResponseInspector state={{ status: "idle" }} />);

    expect(screen.getByRole("status").textContent).toBe(
      "Send a request to see the response.",
    );
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  test("announces that a request is executing", () => {
    render(<ResponseInspector state={{ status: "executing" }} />);

    expect(screen.getByRole("status").textContent).toBe("Sending request…");
  });

  test("summarizes a successful response and shows the three tabs", () => {
    const response = makeResponse({
      status: 200,
      statusText: "OK",
      durationMs: 12.4,
      sizeBytes: 42,
    });
    render(<ResponseInspector state={completed(responseResult(response))} />);

    expect(screen.getByRole("status").textContent).toBe(
      "Success: 200 OK · 12 ms · 42 bytes",
    );
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["Overview", "Body", "Metadata"]);
  });

  test("selects the Body tab by default", () => {
    render(
      <ResponseInspector state={completed(responseResult(makeResponse()))} />,
    );

    expect(
      screen.getByRole("tab", { name: "Body" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  test("labels a 4xx or 5xx response as an HTTP error, in words", () => {
    const response = makeResponse({ status: 503, statusText: "" });
    render(<ResponseInspector state={completed(responseResult(response))} />);

    expect(screen.getByRole("status").textContent).toContain("HTTP error: 503");
  });

  test("shows a processing error alongside the response", () => {
    const error = createProcessingError("JSON_PARSE_ERROR");
    const response = makeResponse({
      bodyClass: "json",
      rawBody: "{",
      processingError: error,
    });
    render(<ResponseInspector state={completed(responseResult(response))} />);

    expect(screen.getByRole("status").textContent).toContain(
      `Processing error: ${error.message}`,
    );
  });

  test("shows an execution failure with its message and code, without tabs", () => {
    render(
      <ResponseInspector
        state={completed(failureResult("TIMEOUT", "browser"))}
      />,
    );

    const status = screen.getByRole("status").textContent;
    expect(status).toContain("Request failed:");
    expect(status).toContain("(TIMEOUT)");
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  test("shows cancellation neutrally, not as a failure", () => {
    render(
      <ResponseInspector
        state={completed(failureResult("CANCELLED", "browser"))}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Request cancelled.");
  });

  test("keeps only the summary in the live region, not the body", () => {
    const response = makeResponse({
      bodyClass: "text",
      rawBody: "a long body",
      sizeBytes: 11,
    });
    render(<ResponseInspector state={completed(responseResult(response))} />);

    expect(screen.getByRole("status").textContent).not.toContain("a long body");
    expect(screen.getByLabelText("Response body").textContent).toBe(
      "a long body",
    );
  });

  test("keeps the selected tab when a new response arrives", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ResponseInspector state={completed(responseResult(makeResponse()))} />,
    );

    await user.click(screen.getByRole("tab", { name: "Metadata" }));
    rerender(<ResponseInspector state={{ status: "executing" }} />);
    rerender(
      <ResponseInspector
        state={completed(responseResult(makeResponse({ status: 201 })))}
      />,
    );

    expect(
      screen
        .getByRole("tab", { name: "Metadata" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });
});
