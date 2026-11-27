import type { NormalizedResponse } from "@/domain/response/model";
import {
  describeOutcome,
  formatBytes,
  formatDuration,
  STRATEGY_LABELS,
} from "../../response-view";

export function MetadataTab({ response }: { response: NormalizedResponse }) {
  const durationLabel =
    response.strategy === "proxy"
      ? "Duration (upstream, measured by the proxy)"
      : "Duration (measured in the browser)";

  const rows: [string, string][] = [
    ["Status", String(response.status)],
    ["Status text", response.statusText || "Not provided"],
    [durationLabel, formatDuration(response.durationMs)],
    [
      "Size (decoded body)",
      `${formatBytes(response.sizeBytes)} (${response.sizeBytes.toLocaleString("en-US")} bytes)`,
    ],
    ["Content type", response.contentType ?? "Not provided"],
    ["Strategy", STRATEGY_LABELS[response.strategy]],
    ["Outcome", describeOutcome(response)],
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1">
        {rows.map(([term, detail]) => (
          <div key={term} className="contents">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="font-mono break-words">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="flex min-w-0 flex-col gap-2">
        {response.strategy === "browser" && (
          <p className="text-muted-foreground">
            Browser-direct requests only show CORS-safelisted headers and those
            the server lists in{" "}
            <span className="font-mono">Access-Control-Expose-Headers</span>.{" "}
            <span className="font-mono">Set-Cookie</span> is never visible.
          </p>
        )}
        {response.headers.length === 0 ? (
          <p>No response headers are visible.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            <table className="w-full text-left">
              <caption className="sr-only">Response headers</caption>
              <thead className="bg-muted/40">
                <tr>
                  <th scope="col" className="px-3 py-1.5 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-1.5 font-medium">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {response.headers.map((header, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-1.5 align-top whitespace-nowrap">
                      {header.name}
                    </td>
                    <td className="px-3 py-1.5 break-all">{header.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
