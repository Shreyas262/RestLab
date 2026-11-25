import { describe, expect, test } from "vitest";
import { decodeText } from "./decode";

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("decodeText", () => {
  test("decodes UTF-8 by default", () => {
    expect(decodeText(utf8("héllo ✓"))).toEqual({
      ok: true,
      text: "héllo ✓",
    });
  });

  test("strips a UTF-8 byte order mark", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8("hi")]);
    expect(decodeText(bytes, "utf-8")).toEqual({ ok: true, text: "hi" });
  });

  test("decodes with the declared charset", () => {
    expect(
      decodeText(new Uint8Array([0x63, 0x61, 0x66, 0xe9]), "iso-8859-1"),
    ).toEqual({ ok: true, text: "café" });
  });

  test("replaces bytes that are not valid in the charset by default", () => {
    expect(decodeText(new Uint8Array([0x68, 0xff, 0x69]), "utf-8")).toEqual({
      ok: true,
      text: "h�i",
    });
  });

  test("fails on invalid bytes in strict mode", () => {
    expect(
      decodeText(new Uint8Array([0xff, 0xfe, 0xfd]), "utf-8", { strict: true }),
    ).toEqual({ ok: false });
  });

  test.each([false, true])(
    "fails on an unknown charset label (strict: %s)",
    (strict) => {
      expect(decodeText(utf8("hi"), "x-not-a-charset", { strict })).toEqual({
        ok: false,
      });
    },
  );
});
