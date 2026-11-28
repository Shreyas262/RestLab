import { describe, expect, test } from "vitest";
import { PUBLIC_APIS, type PublicApi } from "./public-apis";
import { searchPublicApis } from "./search-public-apis";

function ids(apis: readonly PublicApi[]) {
  return apis.map((api) => api.id);
}

describe("searchPublicApis (FR-09)", () => {
  test("returns every API, in order, for an empty or blank query", () => {
    expect(searchPublicApis(PUBLIC_APIS, "")).toBe(PUBLIC_APIS);
    expect(searchPublicApis(PUBLIC_APIS, "   ")).toBe(PUBLIC_APIS);
  });

  test("matches the name regardless of case", () => {
    expect(ids(searchPublicApis(PUBLIC_APIS, "jsonPLACEHOLDER"))).toEqual([
      "jsonplaceholder",
    ]);
  });

  test("ignores accents", () => {
    expect(ids(searchPublicApis(PUBLIC_APIS, "pokeapi"))).toEqual(["pokeapi"]);
  });

  test("matches the description", () => {
    expect(ids(searchPublicApis(PUBLIC_APIS, "forecasts"))).toContain(
      "open-meteo",
    );
  });

  test("matches the category name", () => {
    const results = searchPublicApis(PUBLIC_APIS, "developer tools");
    expect(results.length).toBeGreaterThan(0);
    expect(ids(results)).toContain("github");
  });

  test("matches the base URL", () => {
    expect(ids(searchPublicApis(PUBLIC_APIS, "api.github.com"))).toEqual([
      "github",
    ]);
  });

  test("requires every word to match, in any order", () => {
    expect(ids(searchPublicApis(PUBLIC_APIS, "github  repositories"))).toEqual([
      "github",
    ]);
    expect(ids(searchPublicApis(PUBLIC_APIS, "repositories github"))).toEqual([
      "github",
    ]);
    expect(searchPublicApis(PUBLIC_APIS, "github weather")).toEqual([]);
  });

  test("returns nothing when no API matches", () => {
    expect(searchPublicApis(PUBLIC_APIS, "zzzz-no-such-api")).toEqual([]);
  });
});
