import { describe, expect, test } from "vitest";
import { createProcessingError } from "../errors/processing-errors";
import { parseJson } from "./parse";

describe("parseJson", () => {
  test.each([
    ['{"a":1}', { a: 1 }],
    ["[1,2]", [1, 2]],
    ['"text"', "text"],
    ["42", 42],
    ["true", true],
    ["null", null],
  ])("parses %s", (text, expected) => {
    expect(parseJson(text)).toEqual({ ok: true, value: expected });
  });

  test.each(['{"a":', "{'a':1}", "", "   ", "undefined"])(
    "returns JSON_PARSE_ERROR for %j",
    (text) => {
      expect(parseJson(text)).toEqual({
        ok: false,
        error: createProcessingError("JSON_PARSE_ERROR"),
      });
    },
  );
});
