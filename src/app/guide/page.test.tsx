import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import GuidePage from "@/app/guide/page";
import { GUIDE_TOPICS, guideHref } from "@/features/guide/guide-topics";

describe("guide page (FR-09)", () => {
  test("shows a table of contents linking every topic", () => {
    render(<GuidePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Guide" }),
    ).toBeDefined();
    const toc = within(
      screen.getByRole("navigation", { name: "Guide topics" }),
    );
    for (const topic of GUIDE_TOPICS) {
      expect(
        toc.getByRole("link", { name: topic.title }).getAttribute("href"),
      ).toBe(guideHref(topic.slug));
    }
  });
});
