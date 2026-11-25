export type DecodeResult = { ok: true; text: string } | { ok: false };

/**
 * Fails on an unknown charset label. Malformed byte sequences become U+FFFD,
 * so a bad byte never hides a readable body; `strict` makes them fail instead,
 * which is how a body without a `Content-Type` is tested for being text.
 */
export function decodeText(
  bytes: Uint8Array,
  charset: string | null = null,
  { strict = false }: { strict?: boolean } = {},
): DecodeResult {
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(charset ?? "utf-8", { fatal: strict });
  } catch {
    return { ok: false };
  }

  try {
    return { ok: true, text: decoder.decode(bytes) };
  } catch {
    return { ok: false };
  }
}
