export type JsonTokenType =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punctuation"
  | "whitespace";

export interface JsonToken {
  type: JsonTokenType;
  text: string;
}

const STRING = /"(?:[^"\\\u0000-\u001f]|\\.)*"/y;
const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const LITERAL = /true|false|null/y;
const WHITESPACE = /[ \t\n\r]+/y;

function matchAt(pattern: RegExp, text: string, index: number): string | null {
  pattern.lastIndex = index;
  return pattern.exec(text)?.[0] ?? null;
}

/**
 * Splits JSON text into tokens, keeping every value exactly as written.
 * Returns `null` at the first character that cannot start a token.
 */
export function tokenizeJson(text: string): JsonToken[] | null {
  const tokens: JsonToken[] = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];
    let token: JsonToken | null = null;

    if ("{}[]:,".includes(char)) {
      token = { type: "punctuation", text: char };
    } else if (char === '"') {
      const match = matchAt(STRING, text, index);
      if (match !== null) token = { type: "string", text: match };
    } else if (char === "-" || (char >= "0" && char <= "9")) {
      const match = matchAt(NUMBER, text, index);
      if (match !== null) token = { type: "number", text: match };
    } else if (char === "t" || char === "f" || char === "n") {
      const match = matchAt(LITERAL, text, index);
      if (match !== null) {
        token = { type: match === "null" ? "null" : "boolean", text: match };
      }
    } else {
      const match = matchAt(WHITESPACE, text, index);
      if (match !== null) token = { type: "whitespace", text: match };
    }

    if (token === null) return null;
    tokens.push(token);
    index += token.text.length;
  }

  return markKeys(tokens);
}

function markKeys(tokens: JsonToken[]): JsonToken[] {
  let previous: JsonToken | null = null;
  for (let index = tokens.length - 1; index >= 0; index--) {
    const token = tokens[index];
    if (token.type === "whitespace") continue;
    if (token.type === "string" && previous?.text === ":") {
      tokens[index] = { type: "key", text: token.text };
    }
    previous = token;
  }
  return tokens;
}

/**
 * Re-indents JSON text from its tokens instead of `JSON.stringify(JSON.parse(text))`,
 * so large numbers, duplicate keys, and escapes appear exactly as received (ADR-025).
 * The layout matches `JSON.stringify(value, null, indent)`. Returns `null` if the
 * text cannot be tokenized or its brackets do not balance.
 */
export function formatJson(text: string, indent = 2): JsonToken[] | null {
  const tokens = tokenizeJson(text);
  if (tokens === null) return null;

  const significant = tokens.filter((token) => token.type !== "whitespace");
  const output: JsonToken[] = [];
  let depth = 0;
  const newline = (level: number): JsonToken => ({
    type: "whitespace",
    text: "\n" + " ".repeat(level * indent),
  });

  for (let index = 0; index < significant.length; index++) {
    const token = significant[index];
    const next = significant[index + 1];

    switch (token.text) {
      case "{":
      case "[": {
        const close = token.text === "{" ? "}" : "]";
        if (next?.text === close) {
          output.push(token, next);
          index++;
        } else {
          depth++;
          output.push(token, newline(depth));
        }
        break;
      }
      case "}":
      case "]":
        depth--;
        if (depth < 0) return null;
        output.push(newline(depth), token);
        break;
      case ",":
        output.push(token, newline(depth));
        break;
      case ":":
        output.push(token, { type: "whitespace", text: " " });
        break;
      default:
        output.push(token);
    }
  }

  return depth === 0 ? output : null;
}

export function tokensToText(tokens: readonly JsonToken[]): string {
  return tokens.map((token) => token.text).join("");
}
