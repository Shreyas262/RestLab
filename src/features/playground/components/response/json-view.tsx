import type { JsonToken, JsonTokenType } from "@/domain/response/json-tokens";
import { CodeBlock } from "./code-block";

const TOKEN_CLASSES: Readonly<Record<JsonTokenType, string | undefined>> = {
  key: "text-sky-700 dark:text-sky-300",
  string: "text-emerald-700 dark:text-emerald-300",
  number: "text-amber-700 dark:text-amber-300",
  boolean: "text-violet-700 dark:text-violet-300",
  null: "text-violet-700 dark:text-violet-300",
  punctuation: "text-muted-foreground",
  whitespace: undefined,
};

interface JsonViewProps {
  label: string;
  tokens: readonly JsonToken[];
}

/** Highlighted JSON as React text nodes; never HTML (ADR-015). */
export function JsonView({ label, tokens }: JsonViewProps) {
  return (
    <CodeBlock label={label}>
      {tokens.map((token, index) =>
        token.type === "whitespace" ? (
          token.text
        ) : (
          <span
            key={index}
            data-token={token.type}
            className={TOKEN_CLASSES[token.type]}
          >
            {token.text}
          </span>
        ),
      )}
    </CodeBlock>
  );
}
