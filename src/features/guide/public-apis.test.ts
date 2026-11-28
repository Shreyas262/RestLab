import { describe, expect, test } from "vitest";
import { requestSchema } from "@/domain/request/schema";
import {
  API_CATEGORIES,
  PUBLIC_APIS,
  SAMPLE_PARAM,
  findPublicApi,
  sampleHref,
} from "./public-apis";

describe("public API directory data (FR-09)", () => {
  test.each(PUBLIC_APIS.map((api) => [api.id, api] as const))(
    "%s sample passes the request schema",
    (_id, api) => {
      expect(requestSchema.safeParse(api.sample).success).toBe(true);
    },
  );

  test("ids are unique, lowercase slugs", () => {
    const ids = PUBLIC_APIS.map((api) => api.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("every entry belongs to a known category and every category has entries", () => {
    const categoryIds = API_CATEGORIES.map((category) => category.id);
    for (const api of PUBLIC_APIS) expect(categoryIds).toContain(api.category);
    for (const id of categoryIds) {
      expect(PUBLIC_APIS.some((api) => api.category === id)).toBe(true);
    }
  });

  test("samples run browser-direct against the entry's own base URL over HTTPS", () => {
    for (const api of PUBLIC_APIS) {
      expect(api.browserDirect).toBe(true);
      expect(api.sample.strategy).toBe("browser");
      expect(new URL(api.baseUrl).protocol).toBe("https:");
      expect(new URL(api.docsUrl).protocol).toBe("https:");
      expect(new URL(api.sample.url).origin).toBe(new URL(api.baseUrl).origin);
    }
  });

  test("last-checked dates are real ISO dates, not in the future", () => {
    for (const api of PUBLIC_APIS) {
      expect(api.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const checked = new Date(`${api.lastChecked}T00:00:00Z`);
      expect(checked.toISOString().slice(0, 10)).toBe(api.lastChecked);
      expect(checked.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("sample lookup and links (FR-09)", () => {
  test("finds an entry by id and returns undefined for an unknown id", () => {
    expect(findPublicApi("jsonplaceholder")?.name).toBe("JSONPlaceholder");
    expect(findPublicApi("no-such-api")).toBeUndefined();
  });

  test("builds a playground link that carries the sample id", () => {
    expect(sampleHref("jsonplaceholder")).toBe("/?sample=jsonplaceholder");
    const url = new URL(sampleHref("a b&c"), "http://localhost");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get(SAMPLE_PARAM)).toBe("a b&c");
  });
});
