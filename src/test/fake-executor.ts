import { vi } from "vitest";
import type { RequestConfig } from "@/domain/request/schema";
import type { Executor } from "@/execution/contract/executor";
import type { ExecutionResult } from "@/execution/contract/result";

export interface PendingExecution {
  request: RequestConfig;
  signal: AbortSignal;
  settle: (result: ExecutionResult) => void;
}

/** An executor whose calls stay pending until the test settles them. */
export function controllableExecutor() {
  const calls: PendingExecution[] = [];
  const executor = vi.fn<Executor>(
    (request, signal) =>
      new Promise<ExecutionResult>((resolve) => {
        calls.push({ request, signal, settle: resolve });
      }),
  );
  return { executor, calls };
}
