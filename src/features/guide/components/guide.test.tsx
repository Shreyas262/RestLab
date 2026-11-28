import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { GUIDE_TOPICS, guideHref } from "../guide-topics";
import { findPublicApi, SAMPLE_PARAM } from "../public-apis";
import { GuideArticle } from "./guide-article";
import { GuideIndex } from "./guide-index";

const firstTopic = GUIDE_TOPICS[0];
const lastTopic = GUIDE_TOPICS[GUIDE_TOPICS.length - 1];

function topicNav() {
  return within(screen.getByRole("navigation", { name: "Guide topics" }));
}

function pagerNav() {
  return within(
    screen.getByRole("navigation", { name: "Previous and next topics" }),
  );
}

describe("guide index (FR-09)", () => {
  test("lists every topic in order, with its link and summary", () => {
    render(<GuideIndex />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Guide" }),
    ).toBeDefined();
    const links = topicNav().getAllByRole("link");
    expect(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual(
      GUIDE_TOPICS.map((topic) => [topic.title, guideHref(topic.slug)]),
    );
    for (const topic of GUIDE_TOPICS) {
      expect(screen.getByText(topic.summary)).toBeDefined();
    }
  });

  test("links to the public API directory", () => {
    render(<GuideIndex />);
    expect(
      screen.getByRole("link", { name: "Public APIs" }).getAttribute("href"),
    ).toBe("/apis");
  });
});

describe("guide article (FR-09)", () => {
  test.each(GUIDE_TOPICS)(
    "$slug has a title, sections, and links only to existing pages",
    (topic) => {
      render(<GuideArticle topic={topic} />);

      const article = within(
        screen.getByRole("article", { name: topic.title }),
      );
      expect(
        article.getByRole("heading", { level: 1, name: topic.title }),
      ).toBeDefined();
      expect(
        article.getAllByRole("heading", { level: 2 }).length,
      ).toBeGreaterThan(0);

      const knownPaths = new Set([
        "/guide",
        "/apis",
        ...GUIDE_TOPICS.map((item) => guideHref(item.slug)),
      ]);
      for (const link of article.getAllByRole("link")) {
        const url = new URL(link.getAttribute("href") ?? "", "http://test");
        const sampleId = url.searchParams.get(SAMPLE_PARAM);
        if (url.pathname === "/" && sampleId !== null) {
          expect(findPublicApi(sampleId), sampleId).toBeDefined();
        } else {
          expect(knownPaths, url.pathname).toContain(url.pathname);
        }
      }
    },
  );

  test("marks the current topic in the topic list", () => {
    render(<GuideArticle topic={GUIDE_TOPICS[2]} />);

    for (const topic of GUIDE_TOPICS) {
      const link = topicNav().getByRole("link", { name: topic.title });
      expect(link.getAttribute("aria-current")).toBe(
        topic === GUIDE_TOPICS[2] ? "page" : null,
      );
    }
    expect(
      topicNav().getByRole("link", { name: "Guide" }).getAttribute("href"),
    ).toBe("/guide");
  });

  test("links the previous and next topics", () => {
    render(<GuideArticle topic={GUIDE_TOPICS[1]} />);

    expect(
      pagerNav()
        .getByRole("link", { name: `Previous: ${firstTopic.title}` })
        .getAttribute("href"),
    ).toBe(guideHref(firstTopic.slug));
    expect(
      pagerNav()
        .getByRole("link", { name: `Next: ${GUIDE_TOPICS[2].title}` })
        .getAttribute("href"),
    ).toBe(guideHref(GUIDE_TOPICS[2].slug));
  });

  test("has no previous link on the first topic and no next link on the last", () => {
    const { unmount } = render(<GuideArticle topic={firstTopic} />);
    expect(pagerNav().queryByRole("link", { name: /^Previous/ })).toBeNull();
    unmount();

    render(<GuideArticle topic={lastTopic} />);
    expect(pagerNav().queryByRole("link", { name: /^Next/ })).toBeNull();
  });
});
