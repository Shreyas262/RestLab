import { useWatch, type Control } from "react-hook-form";
import { buildFinalUrl } from "@/domain/request/build-url";
import type { RequestConfig } from "@/domain/request/schema";

interface FinalUrlPreviewProps {
  control: Control<RequestConfig>;
}

export function FinalUrlPreview({ control }: FinalUrlPreviewProps) {
  const [url, params] = useWatch({ control, name: ["url", "params"] });
  const finalUrl = buildFinalUrl(url, params);

  return (
    <p className="min-w-0 text-sm">
      <span className="text-muted-foreground">Final URL: </span>
      {finalUrl === null ? (
        <span className="text-muted-foreground">
          Enter a valid URL to see the final request URL.
        </span>
      ) : (
        <code className="font-mono break-all">{finalUrl}</code>
      )}
    </p>
  );
}
