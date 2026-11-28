import { describe, expect, test } from "vitest";
import {
  findGuideTopic,
  GUIDE_PATH,
  GUIDE_TOPICS,
  guideHref,
} from "./guide-topics";

describe("guide topics (FR-09)", () => {
  test("covers the five FR-09 topics in reading order", () => {
    expect(GUIDE_TOPICS.map((topic) => topic.slug)).toEqual([
      "first-request",
      "parameters-headers-body",
      "reading-responses",
      "strategies-and-cors",
      "saved-templates",
    ]);
  });

  test("gives every topic a URL-safe slug, a title, and a summary", () => {
    for (const topic of GUIDE_TOPICS) {
      expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(topic.title.trim()).not.toBe("");
      expect(topic.summary.trim()).not.toBe("");
    }
  });

  test("finds a topic by slug and ignores unknown slugs", () => {
    expect(findGuideTopic("saved-templates")?.title).toBe("Saved templates");
    expect(findGuideTopic("missing")).toBeUndefined();
  });

  test("builds topic links under the guide path", () => {
    expect(GUIDE_PATH).toBe("/guide");
    expect(guideHref("first-request")).toBe("/guide/first-request");
  });
});
