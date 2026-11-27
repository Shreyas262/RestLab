import { describe, expect, test } from "vitest";
import { makeRequest, row } from "@/test/fixtures/requests";
import { prepareRequest } from "./prepare-request";

describe("prepareRequest (FR-02, FR-04)", () => {
  test("builds the final URL and keeps the method", () => {
    const prepared = prepareRequest(
      makeRequest({
        method: "PATCH",
        url: "https://example.com/a?x=1",
        params: [row("y", "2")],
      }),
    );
    expect(prepared.url).toBe("https://example.com/a?x=1&y=2");
    expect(prepared.method).toBe("PATCH");
  });

  test("sends only enabled headers with a name, trimmed, keeping duplicates", () => {
    const prepared = prepareRequest(
      makeRequest({
        headers: [
          row("  Accept ", "application/json"),
          row("X-Off", "1", false),
          row("", "orphan"),
          row("X-Tag", "a"),
          row("X-Tag", "b"),
        ],
      }),
    );
    expect(prepared.headers).toEqual([
      ["Accept", "application/json"],
      ["X-Tag", "a"],
      ["X-Tag", "b"],
    ]);
  });

  test("never sends a body for GET, even with body text kept in the editor", () => {
    const prepared = prepareRequest(
      makeRequest({
        method: "GET",
        body: { type: "json", content: '{"a":1}' },
      }),
    );
    expect(prepared.body).toBeNull();
    expect(prepared.headers).toEqual([]);
  });

  test("sends no body when the body type is none", () => {
    const prepared = prepareRequest(
      makeRequest({
        method: "POST",
        body: { type: "none", content: "left over" },
      }),
    );
    expect(prepared.body).toBeNull();
    expect(prepared.headers).toEqual([]);
  });

  test("sends the JSON body exactly as typed and derives Content-Type", () => {
    const content = '{\n  "b": 2,\n  "a": 1\n}';
    const prepared = prepareRequest(
      makeRequest({ method: "POST", body: { type: "json", content } }),
    );
    expect(prepared.body).toBe(content);
    expect(prepared.headers).toEqual([["Content-Type", "application/json"]]);
  });

  test("derives text/plain for a text body, including on DELETE", () => {
    const prepared = prepareRequest(
      makeRequest({ method: "DELETE", body: { type: "text", content: "bye" } }),
    );
    expect(prepared.body).toBe("bye");
    expect(prepared.headers).toEqual([["Content-Type", "text/plain"]]);
  });

  test("a user-set Content-Type always wins, matched case-insensitively", () => {
    const prepared = prepareRequest(
      makeRequest({
        method: "PUT",
        headers: [row("content-type", "application/vnd.api+json")],
        body: { type: "json", content: "{}" },
      }),
    );
    expect(prepared.headers).toEqual([
      ["content-type", "application/vnd.api+json"],
    ]);
  });

  test("a disabled user Content-Type does not suppress the derived one", () => {
    const prepared = prepareRequest(
      makeRequest({
        method: "POST",
        headers: [row("Content-Type", "text/csv", false)],
        body: { type: "text", content: "a,b" },
      }),
    );
    expect(prepared.headers).toEqual([["Content-Type", "text/plain"]]);
  });

  test("sends an empty text body as an empty string, not as no body", () => {
    const prepared = prepareRequest(
      makeRequest({ method: "POST", body: { type: "text", content: "" } }),
    );
    expect(prepared.body).toBe("");
  });

  test("throws for a request that would not pass validation", () => {
    expect(() =>
      prepareRequest(makeRequest({ url: "ftp://example.com" })),
    ).toThrow();
  });
});
