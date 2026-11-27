import type { ReactNode } from "react";

interface CodeBlockProps {
  label: string;
  children: ReactNode;
}

/** Scrolls inside itself so wide or long content never widens the page. Focusable so keyboard users can scroll it. */
export function CodeBlock({ label, children }: CodeBlockProps) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className="max-h-[60vh] min-w-0 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <code>{children}</code>
    </pre>
  );
}
