import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "@/app/page";

test("renders the RestLab heading and the request form (FR-01)", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "RestLab" }),
  ).toBeDefined();
  expect(screen.getByRole("form", { name: "Request" })).toBeDefined();
});
