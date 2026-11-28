import Link from "next/link";
import { GUIDE_CONTENT } from "../content";
import { linkClass } from "../content/prose";
import {
  GUIDE_PATH,
  GUIDE_TOPICS,
  guideHref,
  type GuideTopic,
} from "../guide-topics";

// Content components stay plain markup; spacing and list styles for their elements are set here once.
const proseClass =
  "flex flex-col gap-4 leading-7 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-medium [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6";

export function GuideArticle({ topic }: { topic: GuideTopic }) {
  const Content = GUIDE_CONTENT[topic.slug];
  const index = GUIDE_TOPICS.findIndex((item) => item.slug === topic.slug);
  const previous = GUIDE_TOPICS[index - 1];
  const next = GUIDE_TOPICS[index + 1];

  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,48rem)]">
      <nav aria-label="Guide topics" className="text-sm">
        <p className="mb-2 font-medium">
          <Link href={GUIDE_PATH} className={linkClass}>
            Guide
          </Link>
        </p>
        <ol className="flex flex-col gap-2">
          {GUIDE_TOPICS.map((item) => {
            const current = item.slug === topic.slug;
            return (
              <li key={item.slug}>
                <Link
                  href={guideHref(item.slug)}
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? `${linkClass} font-medium no-underline`
                      : `${linkClass} text-muted-foreground no-underline hover:underline`
                  }
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <article aria-labelledby="guide-topic-title" className="min-w-0">
        <h1 id="guide-topic-title" className="mb-4 text-2xl font-semibold">
          {topic.title}
        </h1>
        <div className={proseClass}>
          <Content />
        </div>

        {(previous || next) && (
          <nav
            aria-label="Previous and next topics"
            className="mt-10 flex flex-wrap justify-between gap-4 border-t pt-4 text-sm"
          >
            {previous ? (
              <Link href={guideHref(previous.slug)} className={linkClass}>
                Previous: {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={guideHref(next.slug)} className={linkClass}>
                Next: {next.title}
              </Link>
            )}
          </nav>
        )}
      </article>
    </div>
  );
}
