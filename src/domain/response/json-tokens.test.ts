import { describe, expect, test } from "vitest";
import { formatJson, tokenizeJson, tokensToText } from "./json-tokens";

describe("tokenizeJson (FR-05)", () => {
  test("gives every JSON value type its own token type", () => {
    expect(tokenizeJson('{"a":["s",-1.5e3,true,false,null]}')).toEqual([
      { type: "punctuation", text: "{" },
      { type: "key", text: '"a"' },
      { type: "punctuation", text: ":" },
      { type: "punctuation", text: "[" },
      { type: "string", text: '"s"' },
      { type: "punctuation", text: "," },
      { type: "number", text: "-1.5e3" },
      { type: "punctuation", text: "," },
      { type: "boolean", text: "true" },
      { type: "punctuation", text: "," },
      { type: "boolean", text: "false" },
      { type: "punctuation", text: "," },
      { type: "null", text: "null" },
      { type: "punctuation", text: "]" },
      { type: "punctuation", text: "}" },
    ]);
  });

  test("keeps whitespace as tokens, so joining the tokens gives the input back", () => {
    const text = '{\n  "a" : 1,\t"b": [ ]\r\n}';
    const tokens = tokenizeJson(text);
    expect(tokens?.filter((token) => token.type === "whitespace")).toHaveLength(
      7,
    );
    expect(tokens && tokensToText(tokens)).toBe(text);
  });

  test("marks a string as a key only when a colon follows it", () => {
    const tokens = tokenizeJson('{"k" : "v"}') ?? [];
    expect(tokens.find((token) => token.text === '"k"')?.type).toBe("key");
    expect(tokens.find((token) => token.text === '"v"')?.type).toBe("string");
  });

  test("keeps escapes inside strings as written", () => {
    const text = String.raw`"a \"quoted\" \\ é \n"`;
    expect(tokenizeJson(text)).toEqual([{ type: "string", text }]);
  });

  test("handles a top-level value that is not an object", () => {
    expect(tokenizeJson("42")).toEqual([{ type: "number", text: "42" }]);
    expect(tokenizeJson('"x"')).toEqual([{ type: "string", text: '"x"' }]);
  });

  test("returns an empty list for empty text", () => {
    expect(tokenizeJson("")).toEqual([]);
  });

  test.each(["{a:1}", "'x'", "undefined", '"unterminated', "NaN"])(
    "returns null for text that is not JSON: %s",
    (text) => {
      expect(tokenizeJson(text)).toBeNull();
    },
  );

  test("output is plain text, never markup", () => {
    const tokens = tokenizeJson('{"<b>":"<script>x</script>"}') ?? [];
    for (const token of tokens) {
      expect(typeof token.text).toBe("string");
    }
    expect(tokensToText(tokens)).toBe('{"<b>":"<script>x</script>"}');
  });
});

describe("formatJson (FR-05)", () => {
  const format = (text: string) => {
    const tokens = formatJson(text);
    return tokens && tokensToText(tokens);
  };

  test.each([
    '{"a":1,"b":[1,2,{"c":null}],"d":{"e":true,"f":"x"}}',
    "[]",
    "{}",
    '{"empty":{},"list":[],"nested":[[],[{}]]}',
    '"text"',
    "-0.5",
    "  [ 1 ,\n 2 ]  ",
  ])("matches JSON.stringify layout for %s", (text) => {
    expect(format(text)).toBe(JSON.stringify(JSON.parse(text), null, 2));
  });

  test("keeps large numbers exactly as received", () => {
    expect(format('{"id":12345678901234567890}')).toBe(
      '{\n  "id": 12345678901234567890\n}',
    );
  });

  test("keeps duplicate keys", () => {
    expect(format('{"a":1,"a":2}')).toBe('{\n  "a": 1,\n  "a": 2\n}');
  });

  test("keeps escapes as written instead of re-encoding them", () => {
    expect(format(String.raw`["é"]`)).toBe(String.raw`[
  "é"
]`);
  });

  test("uses the given indent", () => {
    expect(format('{"a":[1]}')).toBe('{\n  "a": [\n    1\n  ]\n}');
    const tokens = formatJson('{"a":[1]}', 4);
    expect(tokens && tokensToText(tokens)).toBe(
      '{\n    "a": [\n        1\n    ]\n}',
    );
  });

  test("keeps key and value token types for highlighting", () => {
    const types = (formatJson('{"k":"v"}') ?? [])
      .filter((token) => token.type !== "whitespace")
      .map((token) => token.type);
    expect(types).toEqual([
      "punctuation",
      "key",
      "punctuation",
      "string",
      "punctuation",
    ]);
  });

  test.each(["{a:1}", '{"a":1', '{"a":1}}', "]"])(
    "returns null for text it cannot format: %s",
    (text) => {
      expect(formatJson(text)).toBeNull();
    },
  );
});
