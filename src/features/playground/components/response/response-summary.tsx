import type { NormalizedResponse } from "@/domain/response/model";
import {
  describeOutcome,
  formatBytes,
  formatDuration,
  statusLabel,
} from "../../response-view";

/** One line: outcome in words, status, duration, size. Never color alone. */
export function ResponseSummary({
  response,
}: {
  response: NormalizedResponse;
}) {
  return (
    <p>
      <span className="font-medium">{describeOutcome(response)}:</span>{" "}
      <span className="font-mono">
        {statusLabel(response)} · {formatDuration(response.durationMs)} ·{" "}
        {formatBytes(response.sizeBytes)}
      </span>
    </p>
  );
}
