import { useId } from "react";
import type { NormalizedResponse } from "@/domain/response/model";
import type { FailureResult } from "@/execution/contract/result";
import type { ExecutionState } from "../hooks/use-execution";

interface ExecutionOutputProps {
  state: ExecutionState;
}

/** Temporary output until the M4 response inspector replaces it. Never renders the body. */
export function ExecutionOutput({ state }: ExecutionOutputProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="text-sm">
      <h2 id={headingId} className="mb-2 font-medium">
        Result
      </h2>
      <div role="status">
        {state.status === "idle" && (
          <p className="text-muted-foreground">
            Send a request to see the result.
          </p>
        )}
        {state.status === "executing" && <p>Sending request…</p>}
        {state.status === "completed" &&
          (state.result.kind === "response" ? (
            <ResponseSummary response={state.result.response} />
          ) : (
            <FailureSummary result={state.result} />
          ))}
      </div>
    </section>
  );
}

function ResponseSummary({ response }: { response: NormalizedResponse }) {
  const outcome = response.status >= 400 ? "HTTP error" : "Response received";
  const status = [response.status, response.statusText]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <p>
        <span className="font-medium">{outcome}:</span>{" "}
        <span className="font-mono">{status}</span>
      </p>
      <p className="font-mono text-muted-foreground">
        {Math.round(response.durationMs)} ms · {response.sizeBytes} bytes ·{" "}
        {response.contentType ?? "no content type"}
      </p>
      {response.processingError && <p>{response.processingError.message}</p>}
    </div>
  );
}

function FailureSummary({ result }: { result: FailureResult }) {
  const { code, message } = result.failure;
  if (code === "CANCELLED") return <p>{message}</p>;

  return (
    <p>
      <span className="font-medium">Request failed:</span> {message}{" "}
      <span className="font-mono text-muted-foreground">({code})</span>
    </p>
  );
}
