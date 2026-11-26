import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createProcessingError } from "@/domain/errors/processing-errors";
import { failureResult, responseResult } from "@/execution/contract/result";
import { makeResponse } from "@/test/fixtures/responses";
import { ExecutionOutput } from "./execution-output";

describe("ExecutionOutput", () => {
  test("shows a prompt before anything is sent", () => {
    render(<ExecutionOutput state={{ status: "idle" }} />);

    expect(screen.getByRole("status").textContent).toBe(
      "Send a request to see the result.",
    );
  });

  test("announces that a request is executing", () => {
    render(<ExecutionOutput state={{ status: "executing" }} />);

    expect(screen.getByRole("status").textContent).toBe("Sending request…");
  });

  test("summarizes a successful response", () => {
    const response = makeResponse({
      status: 200,
      statusText: "OK",
      durationMs: 12.4,
      sizeBytes: 42,
      contentType: "application/json",
    });
    render(
      <ExecutionOutput
        state={{ status: "completed", result: responseResult(response) }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Response received: 200 OK");
    expect(status.textContent).toContain("12 ms · 42 bytes · application/json");
  });

  test("labels a 4xx or 5xx response as an HTTP error, in words", () => {
    const response = makeResponse({ status: 503, statusText: "" });
    render(
      <ExecutionOutput
        state={{ status: "completed", result: responseResult(response) }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("HTTP error: 503");
    expect(status.textContent).toContain("no content type");
  });

  test("shows a processing error alongside the response", () => {
    const response = makeResponse({
      contentType: "application/json",
      processingError: createProcessingError("JSON_PARSE_ERROR"),
    });
    render(
      <ExecutionOutput
        state={{ status: "completed", result: responseResult(response) }}
      />,
    );

    expect(screen.getByText(/the body could not be parsed/)).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain(
      "Response received: 200 OK",
    );
  });

  test("shows an execution failure with its message and code", () => {
    render(
      <ExecutionOutput
        state={{
          status: "completed",
          result: failureResult("TIMEOUT", "browser"),
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe(
      "Request failed: The request timed out before a response arrived. (TIMEOUT)",
    );
  });

  test("shows cancellation neutrally, not as a failure", () => {
    render(
      <ExecutionOutput
        state={{
          status: "completed",
          result: failureResult("CANCELLED", "browser"),
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Request cancelled.");
  });
});
