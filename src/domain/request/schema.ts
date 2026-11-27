import { z } from "zod";
import { isValidHeaderName, isValidHeaderValue } from "./header-rules";
import { sendsBody } from "./body-rules";
import { checkUrl } from "./url-rules";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const BODY_TYPES = ["none", "json", "text"] as const;
export const EXECUTION_STRATEGIES = ["browser", "proxy"] as const;

export const keyValueRowSchema = z.object({
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

export const requestBodySchema = z.object({
  type: z.enum(BODY_TYPES),
  content: z.string(),
});

/** The request structure without the field rules. Saved templates use it (ADR-026). */
export const requestShape = z.object({
  url: z.string(),
  method: z.enum(HTTP_METHODS),
  params: z.array(keyValueRowSchema),
  headers: z.array(keyValueRowSchema),
  body: requestBodySchema,
  strategy: z.enum(EXECUTION_STRATEGIES),
});

export const requestSchema = requestShape.superRefine((request, ctx) => {
  const urlProblem = checkUrl(request.url);
  if (urlProblem) {
    ctx.addIssue({ code: "custom", path: ["url"], message: urlProblem });
  }

  request.headers.forEach((row, index) => {
    const name = row.key.trim();
    if (!row.enabled || name === "") return;
    if (!isValidHeaderName(name)) {
      ctx.addIssue({
        code: "custom",
        path: ["headers", index, "key"],
        message: `"${name}" is not a valid header name.`,
      });
    }
    if (!isValidHeaderValue(row.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["headers", index, "value"],
        message: "Header values cannot contain line breaks or null characters.",
      });
    }
  });

  if (sendsBody(request.method, request.body) && request.body.type === "json") {
    try {
      JSON.parse(request.body.content);
    } catch (error) {
      const detail = error instanceof SyntaxError ? ` ${error.message}` : "";
      ctx.addIssue({
        code: "custom",
        path: ["body", "content"],
        message: `The body is not valid JSON.${detail}`,
      });
    }
  }
});

export type HttpMethod = (typeof HTTP_METHODS)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type ExecutionStrategy = (typeof EXECUTION_STRATEGIES)[number];
export type KeyValueRow = z.infer<typeof keyValueRowSchema>;
export type RequestBody = z.infer<typeof requestBodySchema>;
export type RequestConfig = z.infer<typeof requestSchema>;
