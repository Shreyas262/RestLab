import { useEffect, useRef, useState } from "react";
import { base64ToBytes } from "@/domain/response/base64";

interface ImagePreviewProps {
  base64: string;
  mimeType: string;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Shows image bytes through an object URL (ADR-024). The effect creates the URL
 * only when the data changes and revokes it on cleanup, so no URL outlives its image.
 * State is keyed by the data, so a new image never shows the previous one's status.
 */
export function ImagePreview({ base64, mimeType }: ImagePreviewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    for: string;
    size: Dimensions;
  } | null>(null);
  const failed = failedFor === base64;
  const size = loaded?.for === base64 ? loaded.size : null;

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    const url = URL.createObjectURL(
      new Blob([base64ToBytes(base64)], { type: mimeType }),
    );
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [base64, mimeType]);

  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL of response bytes, which next/image cannot optimize */}
      <img
        ref={imageRef}
        alt={`Response image (${mimeType || "unknown type"})`}
        hidden={failed}
        onLoad={(event) =>
          setLoaded({
            for: base64,
            size: {
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            },
          })
        }
        onError={() => setFailedFor(base64)}
        className="max-h-[60vh] max-w-full self-start rounded-md border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-size-[16px_16px] object-contain"
      />
      {failed ? (
        <p>
          The body could not be displayed as an image. It may not be a valid{" "}
          <span className="font-mono">{mimeType || "image"}</span> file.
        </p>
      ) : (
        size && (
          <figcaption className="font-mono text-muted-foreground">
            {size.width} × {size.height} px
          </figcaption>
        )
      )}
    </figure>
  );
}
