import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import GuideTopicPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/guide/[topic]/page";
import { GUIDE_TOPICS } from "@/features/guide/guide-topics";
import { NOT_FOUND_ERROR } from "@/test/next-navigation";

function props(topic: string) {
  return {
    params: Promise.resolve({ topic }),
  };
}

describe("guide topic page (FR-09)", () => {
  test("prerenders every topic", () => {
    expect(generateStaticParams()).toEqual(
      GUIDE_TOPICS.map((topic) => ({ topic: topic.slug })),
    );
  });

  test("renders the requested topic", async () => {
    render(await GuideTopicPage(props("strategies-and-cors")));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Execution strategies and CORS",
      }),
    ).toBeDefined();
  });

  test("names the topic in the page title", async () => {
    expect((await generateMetadata(props("saved-templates"))).title).toBe(
      "Saved templates · Guide · RestLab",
    );
  });

  test("returns not found for an unknown topic", async () => {
    await expect(GuideTopicPage(props("missing"))).rejects.toThrow(
      NOT_FOUND_ERROR,
    );
  });
});
