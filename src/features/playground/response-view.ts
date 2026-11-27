import type { ExecutionStrategy } from "@/domain/request/schema";
import { parseContentType } from "@/domain/response/content-type";
import {
  FORMAT_LIMIT_BYTES,
  isWithinFormatLimit,
} from "@/domain/response/display";
import {
  formatJson,
  tokensToText,
  type JsonToken,
} from "@/domain/response/json-tokens";
import type { NormalizedResponse } from "@/domain/response/model";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} ${bytes === 1 ? "byte" : "bytes"}`;
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${roundSize(kilobytes)} KB`;
  return `${roundSize(kilobytes / 1024)} MB`;
}

function roundSize(value: number): string {
  return value < 10
    ? value.toFixed(1).replace(/\.0$/, "")
    : String(Math.round(value));
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function statusLabel(response: NormalizedResponse): string {
  return [response.status, response.statusText].filter(Boolean).join(" ");
}

export function describeOutcome(response: NormalizedResponse): string {
  if (response.status >= 400) return "HTTP error";
  if (response.status >= 300) return "Redirect";
  if (response.status >= 200) return "Success";
  return "Response received";
}

export const STRATEGY_LABELS: Readonly<Record<ExecutionStrategy, string>> = {
  browser: "Browser-direct",
  proxy: "Backend proxy",
};

export type BodyView =
  | { kind: "json"; tokens: JsonToken[]; text: string }
  | { kind: "text"; text: string; note?: string }
  | { kind: "image"; base64: string; mimeType: string }
  | { kind: "binary" }
  | { kind: "empty" }
  | { kind: "unreadable"; message: string };

export const OVER_LIMIT_NOTE = `This JSON body is larger than ${FORMAT_LIMIT_BYTES / 1024} KB, so it is shown as plain text without formatting or highlighting.`;

/** Decides how the Body tab shows a response, so the component only renders (ADR-023, ADR-024, ADR-025). */
export function bodyView(response: NormalizedResponse): BodyView {
  switch (response.bodyClass) {
    case "empty":
      return { kind: "empty" };
    case "binary":
      return { kind: "binary" };
    case "image":
      return response.imageBase64 === undefined
        ? { kind: "binary" }
        : {
            kind: "image",
            base64: response.imageBase64,
            mimeType: parseContentType(response.contentType)?.essence ?? "",
          };
    case "json":
    case "text":
      return textualBodyView(response);
  }
}

function textualBodyView(response: NormalizedResponse): BodyView {
  const raw = response.rawBody;
  if (raw === undefined) {
    return {
      kind: "unreadable",
      message:
        response.processingError?.message ??
        "The response body could not be read as text.",
    };
  }

  if (response.processingError) {
    return { kind: "text", text: raw, note: response.processingError.message };
  }

  if (response.bodyClass === "json") {
    if (!isWithinFormatLimit(response.sizeBytes)) {
      return { kind: "text", text: raw, note: OVER_LIMIT_NOTE };
    }
    const tokens = formatJson(raw);
    if (tokens) return { kind: "json", tokens, text: tokensToText(tokens) };
  }

  return { kind: "text", text: raw };
}

/**
 * The normalized response as the Overview tab shows it. `parsedBody` is left out:
 * it duplicates `rawBody`, and stringifying it would lose digits (ADR-025).
 * Image data is replaced by a short placeholder so megabytes of base64 never reach the page.
 */
export function overviewValue(
  response: NormalizedResponse,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(response)
      .filter(([key]) => key !== "parsedBody")
      .map(([key, value]) =>
        key === "imageBase64" && typeof value === "string"
          ? [
              key,
              `<${formatBytes(value.length)} of base64 image data, shown in the Body tab>`,
            ]
          : [key, value],
      ),
  );
}
