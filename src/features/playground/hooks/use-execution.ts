import { useEffect, useRef, useState } from "react";
import type { ExecutionStrategy, RequestConfig } from "@/domain/request/schema";
import { executeInBrowser } from "@/execution/browser-executor";
import type { Executor } from "@/execution/contract/executor";
import type { ExecutionResult } from "@/execution/contract/result";
import { failureResult } from "@/execution/contract/result";

export type ExecutionState =
  | { status: "idle" }
  | { status: "executing" }
  | { status: "completed"; result: ExecutionResult };

interface CurrentExecution {
  controller: AbortController;
  strategy: ExecutionStrategy;
}

/**
 * Owns the execution state machine (ADR-010). Only the execution held in
 * `current` may write state, so a cancelled, superseded, or unmounted
 * execution can never overwrite newer state.
 */
export function useExecution(executor: Executor = executeInBrowser) {
  const [state, setState] = useState<ExecutionState>({ status: "idle" });
  const current = useRef<CurrentExecution | null>(null);

  useEffect(() => {
    return () => {
      current.current?.controller.abort();
      current.current = null;
    };
  }, []);

  async function send(request: RequestConfig) {
    if (current.current) return;

    const execution: CurrentExecution = {
      controller: new AbortController(),
      strategy: request.strategy,
    };
    current.current = execution;
    setState({ status: "executing" });

    const result = await executor(request, execution.controller.signal);
    if (current.current !== execution) return;

    current.current = null;
    setState({ status: "completed", result });
  }

  // Cancel settles immediately rather than waiting for the executor to notice the abort.
  function cancel() {
    const execution = current.current;
    if (!execution) return;

    current.current = null;
    execution.controller.abort();
    setState({
      status: "completed",
      result: failureResult("CANCELLED", execution.strategy),
    });
  }

  return { state, send, cancel };
}
