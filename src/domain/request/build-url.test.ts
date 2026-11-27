import { describe, expect, test } from "vitest";
import { row } from "@/test/fixtures/requests";
import { buildFinalUrl } from "./build-url";

describe("buildFinalUrl (FR-01)", () => {
  test("returns the URL unchanged apart from normalization when there are no params", () => {
    expect(buildFinalUrl("https://example.com", [])).toBe(
      "https://example.com/",
    );
    expect(buildFinalUrl("https://example.com/a?b=1#top", [])).toBe(
      "https://example.com/a?b=1#top",
    );
  });

  test("appends enabled params", () => {
    expect(
      buildFinalUrl("https://example.com/items", [
        row("page", "2"),
        row("limit", "10"),
      ]),
    ).toBe("https://example.com/items?page=2&limit=10");
  });

  test("preserves an existing query string and appends after it", () => {
    expect(
      buildFinalUrl("https://example.com/items?sort=asc", [row("page", "2")]),
    ).toBe("https://example.com/items?sort=asc&page=2");
  });

  test("keeps duplicate keys, in order", () => {
    expect(
      buildFinalUrl("https://example.com/?tag=a", [
        row("tag", "b"),
        row("tag", "c"),
      ]),
    ).toBe("https://example.com/?tag=a&tag=b&tag=c");
  });

  test("skips disabled rows and rows with an empty key", () => {
    expect(
      buildFinalUrl("https://example.com/", [
        row("a", "1", false),
        row("", "orphan"),
        row("b", "2"),
      ]),
    ).toBe("https://example.com/?b=2");
  });

  test("keeps rows with an empty value", () => {
    expect(buildFinalUrl("https://example.com/", [row("flag", "")])).toBe(
      "https://example.com/?flag=",
    );
  });

  test("percent-encodes keys and values, with spaces as %20", () => {
    expect(
      buildFinalUrl("https://example.com/", [
        row("q", "hello world"),
        row("a&b", "c=d"),
        row("emoji", "✓"),
        row("plus", "1+1"),
      ]),
    ).toBe(
      "https://example.com/?q=hello%20world&a%26b=c%3Dd&emoji=%E2%9C%93&plus=1%2B1",
    );
  });

  test("keeps the fragment after the query", () => {
    expect(
      buildFinalUrl("https://example.com/a#section", [row("x", "1")]),
    ).toBe("https://example.com/a?x=1#section");
  });

  test("handles a URL ending in a bare question mark", () => {
    expect(buildFinalUrl("https://example.com/a?", [row("x", "1")])).toBe(
      "https://example.com/a?x=1",
    );
  });

  test("returns null for a URL that fails validation", () => {
    expect(buildFinalUrl("", [row("a", "1")])).toBeNull();
    expect(buildFinalUrl("not a url", [])).toBeNull();
    expect(buildFinalUrl("ftp://example.com", [])).toBeNull();
    expect(buildFinalUrl("https://u:p@example.com", [])).toBeNull();
  });
});
