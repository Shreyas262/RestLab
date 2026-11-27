import type { NormalizedResponse } from "@/domain/response/model";
import { bodyView, formatBytes } from "../../response-view";
import { CodeBlock } from "./code-block";
import { CopyButton } from "./copy-button";
import { ImagePreview } from "./image-preview";
import { JsonView } from "./json-view";

export function BodyTab({ response }: { response: NormalizedResponse }) {
  const view = bodyView(response);

  switch (view.kind) {
    case "json":
      return (
        <div className="flex flex-col gap-2">
          <Toolbar text={view.text} />
          <JsonView label="Response body" tokens={view.tokens} />
        </div>
      );
    case "text":
      return (
        <div className="flex flex-col gap-2">
          {view.note && (
            <p>
              <span className="font-medium">Note:</span> {view.note}
            </p>
          )}
          <Toolbar text={view.text} />
          <CodeBlock label="Response body">{view.text}</CodeBlock>
        </div>
      );
    case "image":
      return <ImagePreview base64={view.base64} mimeType={view.mimeType} />;
    case "binary":
      return (
        <p>
          Binary content is not displayed.{" "}
          <span className="font-mono text-muted-foreground">
            {response.contentType ?? "No content type"} ·{" "}
            {formatBytes(response.sizeBytes)}
          </span>
        </p>
      );
    case "empty":
      return <p className="text-muted-foreground">The response has no body.</p>;
    case "unreadable":
      return (
        <p>
          <span className="font-medium">Processing error:</span> {view.message}
        </p>
      );
  }
}

function Toolbar({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <CopyButton text={text} />
    </div>
  );
}
