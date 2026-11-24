export const PROCESSING_ERROR_CODES = [
  "JSON_PARSE_ERROR",
  "DECODE_ERROR",
] as const;

export type ProcessingErrorCode = (typeof PROCESSING_ERROR_CODES)[number];

export interface ProcessingError {
  code: ProcessingErrorCode;
  message: string;
}

export const PROCESSING_ERROR_MESSAGES: Readonly<
  Record<ProcessingErrorCode, string>
> = {
  JSON_PARSE_ERROR:
    "The response says it is JSON, but the body could not be parsed. The raw body is shown instead.",
  DECODE_ERROR:
    "The response body could not be decoded as text with its declared character set.",
};

export function createProcessingError(
  code: ProcessingErrorCode,
): ProcessingError {
  return { code, message: PROCESSING_ERROR_MESSAGES[code] };
}
