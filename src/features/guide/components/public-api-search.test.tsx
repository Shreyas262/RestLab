import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { API_CATEGORIES, PUBLIC_APIS } from "../public-apis";
import { PublicApiSearch } from "./public-api-search";

function searchBox() {
  return screen.getByRole("searchbox", { name: "Search APIs" });
}

function entryNames() {
  return screen
    .queryAllByRole("article")
    .map((article) => within(article).getByRole("heading").textContent);
}

describe("public API search (FR-09)", () => {
  test("shows every API and category before a search", () => {
    render(<PublicApiSearch />);

    expect(screen.getByRole("search")).toBeDefined();
    expect(searchBox()).toBeDefined();
    expect(screen.getByRole("status").textContent).toBe(
      `${PUBLIC_APIS.length} APIs`,
    );
    expect(screen.getAllByRole("article")).toHaveLength(PUBLIC_APIS.length);
    expect(screen.getAllByRole("region")).toHaveLength(API_CATEGORIES.length);
  });

  test("filters the entries as you type and announces the count", async () => {
    const user = userEvent.setup();
    render(<PublicApiSearch />);

    await user.type(searchBox(), "github");

    expect(entryNames()).toEqual(["GitHub REST API"]);
    expect(screen.getByRole("status").textContent).toBe(
      `1 of ${PUBLIC_APIS.length} APIs match.`,
    );
  });

  test("hides categories without matches, with their category links", async () => {
    const user = userEvent.setup();
    render(<PublicApiSearch />);

    await user.type(searchBox(), "github");

    const regions = screen.getAllByRole("region");
    expect(regions.map((region) => region.getAttribute("id"))).toEqual([
      "developer",
    ]);
    const nav = within(screen.getByRole("navigation", { name: "Categories" }));
    expect(nav.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Developer tools",
    ]);
  });

  test("says so when nothing matches", async () => {
    const user = userEvent.setup();
    render(<PublicApiSearch />);

    await user.type(searchBox(), "  zzzz-no-such-api ");

    expect(screen.getByRole("status").textContent).toBe(
      "No APIs match “zzzz-no-such-api”.",
    );
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.queryByRole("navigation", { name: "Categories" })).toBeNull();
  });

  test("shows everything again when the search is cleared", async () => {
    const user = userEvent.setup();
    render(<PublicApiSearch />);

    await user.type(searchBox(), "weather");
    await user.clear(searchBox());

    expect(screen.getAllByRole("article")).toHaveLength(PUBLIC_APIS.length);
    expect(screen.getByRole("status").textContent).toBe(
      `${PUBLIC_APIS.length} APIs`,
    );
  });

  test("keeps Try it links on matching entries", async () => {
    const user = userEvent.setup();
    render(<PublicApiSearch />);

    await user.type(searchBox(), "pokemon");

    expect(
      screen
        .getByRole("link", { name: "Try it with PokéAPI" })
        .getAttribute("href"),
    ).toBe("/?sample=pokeapi");
  });
});
