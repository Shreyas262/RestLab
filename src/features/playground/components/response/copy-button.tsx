import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copied" | "failed";

const LABELS: Readonly<Record<CopyState, string>> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

const ICONS = { idle: CopyIcon, copied: CheckIcon, failed: XIcon } as const;

export const COPY_FEEDBACK_MS = 2000;

interface CopyButtonProps {
  text: string;
}

/** Inline copy feedback instead of a toast (UI_UX_GUIDELINES.md §6). */
export function CopyButton({ text }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    let next: CopyState;
    try {
      // Throws when the Clipboard API is missing, as on insecure origins.
      await navigator.clipboard.writeText(text);
      next = "copied";
    } catch {
      next = "failed";
    }
    setState(next);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), COPY_FEEDBACK_MS);
  }

  const Icon = ICONS[state];

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void copy()}
    >
      <Icon aria-hidden="true" />
      <span aria-live="polite">{LABELS[state]}</span>
    </Button>
  );
}
