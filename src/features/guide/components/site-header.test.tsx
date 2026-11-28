import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { navigation } from "@/test/next-navigation";
import { SiteHeader } from "./site-header";

function mainNav() {
  return within(screen.getByRole("navigation", { name: "Main" }));
}

describe("site header (FR-09)", () => {
  test("links the RestLab name to the playground", () => {
    render(<SiteHeader />);
    expect(
      screen.getByRole("link", { name: "RestLab" }).getAttribute("href"),
    ).toBe("/");
  });

  test("lists the Playground and Public APIs pages", () => {
    render(<SiteHeader />);
    expect(
      mainNav()
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Playground", "/"],
      ["Public APIs", "/apis"],
    ]);
  });

  test("marks the playground as the current page on /", () => {
    render(<SiteHeader />);
    expect(
      mainNav()
        .getByRole("link", { name: "Playground" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      mainNav()
        .getByRole("link", { name: "Public APIs" })
        .hasAttribute("aria-current"),
    ).toBe(false);
  });

  test("marks Public APIs as the current page on /apis", () => {
    navigation.pathname = "/apis";
    render(<SiteHeader />);
    expect(
      mainNav()
        .getByRole("link", { name: "Public APIs" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      mainNav()
        .getByRole("link", { name: "Playground" })
        .hasAttribute("aria-current"),
    ).toBe(false);
  });
});
