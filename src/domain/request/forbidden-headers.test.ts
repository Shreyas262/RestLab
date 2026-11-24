import { describe, expect, test } from "vitest";
import { row } from "@/test/fixtures/requests";
import {
  findForbiddenHeaders,
  isForbiddenRequestHeader,
} from "./forbidden-headers";

describe("isForbiddenRequestHeader", () => {
  test.each([
    "Host",
    "cookie",
    "ORIGIN",
    "Content-Length",
    "Referer",
    "Connection",
    "DNT",
    "TE",
    " Via ",
  ])("flags %s", (name) => {
    expect(isForbiddenRequestHeader(name, "x")).toBe(true);
  });

  test.each([
    "Proxy-Authorization",
    "proxy-anything",
    "Sec-Fetch-Mode",
    "sec-ch-ua",
  ])("flags the forbidden prefix in %s", (name) => {
    expect(isForbiddenRequestHeader(name, "x")).toBe(true);
  });

  test.each([
    "Authorization",
    "Accept",
    "Content-Type",
    "User-Agent",
    "X-Api-Key",
    "Secret",
    "Proxyish",
  ])("allows %s", (name) => {
    expect(isForbiddenRequestHeader(name, "x")).toBe(false);
  });

  test("flags method-override headers only when they name a forbidden method", () => {
    expect(isForbiddenRequestHeader("X-HTTP-Method-Override", "TRACE")).toBe(
      true,
    );
    expect(isForbiddenRequestHeader("x-http-method", "get, connect")).toBe(
      true,
    );
    expect(isForbiddenRequestHeader("X-Method-Override", " track ")).toBe(true);
    expect(isForbiddenRequestHeader("X-HTTP-Method-Override", "PATCH")).toBe(
      false,
    );
  });
});

describe("findForbiddenHeaders", () => {
  test("reports enabled forbidden rows with their index", () => {
    const warnings = findForbiddenHeaders([
      row("Accept", "*/*"),
      row(" Cookie ", "a=1"),
      row("Host", "example.com", false),
      row("", "x"),
      row("Sec-Test", "1"),
    ]);
    expect(warnings).toEqual([
      { index: 1, name: "Cookie" },
      { index: 4, name: "Sec-Test" },
    ]);
  });

  test("returns nothing when every header can be sent", () => {
    expect(findForbiddenHeaders([row("Authorization", "Bearer x")])).toEqual(
      [],
    );
  });
});
