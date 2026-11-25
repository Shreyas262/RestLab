import {
  createProcessingError,
  type ProcessingError,
} from "../errors/processing-errors";

export type ParseResult =
  { ok: true; value: unknown } | { ok: false; error: ProcessingError };

export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, error: createProcessingError("JSON_PARSE_ERROR") };
  }
}
