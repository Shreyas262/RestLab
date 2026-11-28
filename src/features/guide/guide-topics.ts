export const GUIDE_PATH = "/guide";

export const GUIDE_TOPICS = [
  {
    slug: "first-request",
    title: "Send your first request",
    summary:
      "Choose a method, enter a URL, press Send, and read what comes back.",
  },
  {
    slug: "parameters-headers-body",
    title: "Parameters, headers, and body",
    summary:
      "Add query parameters and headers, send a JSON or text body, and check the final URL.",
  },
  {
    slug: "reading-responses",
    title: "Read the response",
    summary:
      "What the status line, the Overview, Body, and Metadata tabs, and the error messages tell you.",
  },
  {
    slug: "strategies-and-cors",
    title: "Execution strategies and CORS",
    summary:
      "How requests leave your browser, why some APIs refuse them, and what you can do about it.",
  },
  {
    slug: "saved-templates",
    title: "Saved templates",
    summary:
      "Save requests in this browser, encrypt them with a passphrase, and know what that protects.",
  },
] as const;

export type GuideTopic = (typeof GUIDE_TOPICS)[number];
export type GuideTopicSlug = GuideTopic["slug"];

export function findGuideTopic(slug: string): GuideTopic | undefined {
  return GUIDE_TOPICS.find((topic) => topic.slug === slug);
}

export function guideHref(slug: GuideTopicSlug): string {
  return `${GUIDE_PATH}/${slug}`;
}
