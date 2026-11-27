import { describe, expect, test } from "vitest";
import { base64ToBytes, bytesToBase64 } from "./base64";

const ascii = (text: string) => new TextEncoder().encode(text);

describe("bytesToBase64 and base64ToBytes (FR-05)", () => {
  test.each([
    ["", ""],
    ["M", "TQ=="],
    ["Ma", "TWE="],
    ["Man", "TWFu"],
  ])("encodes %j as %j", (text, expected) => {
    expect(bytesToBase64(ascii(text))).toBe(expected);
  });

  test("round-trips every byte value", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  test("round-trips input longer than one encoding chunk", () => {
    const bytes = Uint8Array.from(
      { length: 100_003 },
      (_, index) => (index * 31) % 256,
    );
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});
