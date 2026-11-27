import { isWithinFormatLimit } from "@/domain/response/display";
import { tokenizeJson } from "@/domain/response/json-tokens";
import type { NormalizedResponse } from "@/domain/response/model";
import { overviewValue } from "../../response-view";
import { CodeBlock } from "./code-block";
import { CopyButton } from "./copy-button";
import { JsonView } from "./json-view";
import { ResponseSummary } from "./response-summary";

export function OverviewTab({ response }: { response: NormalizedResponse }) {
  const text = JSON.stringify(overviewValue(response), null, 2);
  // Character count stands in for bytes here; the text is already formatted.
  const tokens = isWithinFormatLimit(text.length) ? tokenizeJson(text) : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ResponseSummary response={response} />
        <CopyButton text={text} />
      </div>
      {tokens ? (
        <JsonView label="Normalized response" tokens={tokens} />
      ) : (
        <CodeBlock label="Normalized response">{text}</CodeBlock>
      )}
    </div>
  );
}
