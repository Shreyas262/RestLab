export interface MediaType {
  /** Lowercased `type/subtype`, without parameters. */
  essence: string;
  /** Lowercased `charset` parameter, or `null` when not given. */
  charset: string | null;
}

export type DeclaredClass = "json" | "text" | "binary";

const TOKEN = "[!#$%&'*+.^_`|~0-9a-z-]+";
const ESSENCE_PATTERN = new RegExp(`^${TOKEN}/${TOKEN}$`);

const TEXT_ESSENCES = new Set([
  "application/xml",
  "application/javascript",
  "application/ecmascript",
  "application/x-javascript",
  "application/x-www-form-urlencoded",
  "application/yaml",
  "application/x-yaml",
  "application/x-ndjson",
  "application/graphql",
]);

/** Returns `null` for a missing or malformed value, which callers treat as a missing type (API_INTEGRATION.md §4.3). */
export function parseContentType(value: string | null): MediaType | null {
  if (value === null) return null;

  const [rawEssence = "", ...params] = value.split(";");
  const essence = rawEssence.trim().toLowerCase();
  if (!ESSENCE_PATTERN.test(essence)) return null;

  let charset: string | null = null;
  for (const param of params) {
    const separator = param.indexOf("=");
    if (separator === -1) continue;
    const name = param.slice(0, separator).trim().toLowerCase();
    if (name !== "charset") continue;
    const raw = param.slice(separator + 1).trim();
    const unquoted =
      raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')
        ? raw.slice(1, -1)
        : raw;
    if (unquoted !== "") charset = unquoted.toLowerCase();
    break;
  }

  return { essence, charset };
}

export function classifyMediaType(essence: string): DeclaredClass {
  if (essence === "application/json" || essence.endsWith("+json")) {
    return "json";
  }
  if (
    essence.startsWith("text/") ||
    essence.endsWith("+xml") ||
    TEXT_ESSENCES.has(essence)
  ) {
    return "text";
  }
  return "binary";
}
