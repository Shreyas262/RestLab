import type { ValidationIssue } from "../errors/validation";
import { requestSchema, type RequestConfig } from "./schema";

export type ValidationResult =
  | { ok: true; request: RequestConfig }
  | { ok: false; issues: ValidationIssue[] };

/** Validates untrusted input, for example the proxy's request body (ADR-006). */
export function validateRequest(input: unknown): ValidationResult {
  const result = requestSchema.safeParse(input);
  if (result.success) return { ok: true, request: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  };
}
