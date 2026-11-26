import type { RequestConfig } from "@/domain/request/schema";
import type { ExecutionResult } from "./result";

/**
 * Takes a request that passed `requestSchema`. Never rejects: network errors,
 * timeouts, and cancellation all resolve to a failure result.
 */
export type Executor = (
  request: RequestConfig,
  signal: AbortSignal,
) => Promise<ExecutionResult>;
