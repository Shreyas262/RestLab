import type { Failure, FailureCode } from "@/domain/errors/failure-codes";
import { createFailure } from "@/domain/errors/failure-codes";
import type { ExecutionStrategy } from "@/domain/request/schema";
import type { NormalizedResponse } from "@/domain/response/model";

/** What every executor returns, whichever strategy ran (ARCHITECTURE.md §6.4). Validation errors never produce one. */
export type ExecutionResult =
  | { kind: "response"; response: NormalizedResponse }
  | { kind: "failure"; failure: Failure; strategy: ExecutionStrategy };

export type ResponseResult = Extract<ExecutionResult, { kind: "response" }>;
export type FailureResult = Extract<ExecutionResult, { kind: "failure" }>;

export function responseResult(response: NormalizedResponse): ResponseResult {
  return { kind: "response", response };
}

export function failureResult(
  code: FailureCode,
  strategy: ExecutionStrategy,
): FailureResult {
  return { kind: "failure", failure: createFailure(code), strategy };
}
