import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ApisPage from "@/app/apis/page";
import { API_CATEGORIES, PUBLIC_APIS } from "@/features/guide/public-apis";

function entry(name: string) {
  return within(screen.getByRole("article", { name }));
}

describe("public API directory page (FR-09)", () => {
  test("has a page heading and a section for each category", () => {
    render(<ApisPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Public APIs" }),
    ).toBeDefined();
    for (const category of API_CATEGORIES) {
      expect(screen.getByRole("region", { name: category.name })).toBeDefined();
    }
  });

  test("links each category from the category list", () => {
    render(<ApisPage />);
    const nav = within(screen.getByRole("navigation", { name: "Categories" }));
    for (const category of API_CATEGORIES) {
      expect(
        nav.getByRole("link", { name: category.name }).getAttribute("href"),
      ).toBe(`#${category.id}`);
    }
  });

  test("gives every entry a Try it link to the playground with its sample", () => {
    render(<ApisPage />);
    expect(screen.getAllByRole("article")).toHaveLength(PUBLIC_APIS.length);
    for (const api of PUBLIC_APIS) {
      expect(
        entry(api.name)
          .getByRole("link", { name: `Try it with ${api.name}` })
          .getAttribute("href"),
      ).toBe(`/?sample=${api.id}`);
    }
  });

  test("shows the required facts and a documentation link for an entry", () => {
    render(<ApisPage />);
    const jsonplaceholder = entry("JSONPlaceholder");
    expect(
      jsonplaceholder.getByText("https://jsonplaceholder.typicode.com"),
    ).toBeDefined();
    expect(jsonplaceholder.getByText("Not needed")).toBeDefined();
    expect(jsonplaceholder.getByText("Yes")).toBeDefined();
    expect(jsonplaceholder.getByText("2026-11-28")).toBeDefined();
    expect(
      jsonplaceholder.getByText(
        "GET https://jsonplaceholder.typicode.com/posts?userId=1",
      ),
    ).toBeDefined();

    const docs = jsonplaceholder.getByRole("link", {
      name: "Documentation for JSONPlaceholder (opens in a new tab)",
    });
    expect(docs.getAttribute("href")).toBe(
      "https://jsonplaceholder.typicode.com/guide/",
    );
    expect(docs.getAttribute("target")).toBe("_blank");
    expect(docs.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("labels an optional key as optional", () => {
    render(<ApisPage />);
    expect(entry("GitHub REST API").getByText("Optional")).toBeDefined();
  });
});
