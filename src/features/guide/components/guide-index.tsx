import Link from "next/link";
import { GUIDE_TOPICS, guideHref } from "../guide-topics";
import { linkClass } from "../content/prose";

export function GuideIndex() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Guide</h1>
        <p className="text-muted-foreground">
          Short pages on how to use RestLab, one topic each. Start with the
          first if you&apos;re new, or jump to the one you need. To try a real
          API right away, open the{" "}
          <Link href="/apis" className={linkClass}>
            Public APIs
          </Link>{" "}
          directory.
        </p>
      </div>
      <nav aria-label="Guide topics">
        <ol className="flex flex-col gap-4">
          {GUIDE_TOPICS.map((topic) => (
            <li key={topic.slug} className="flex flex-col gap-1">
              <Link
                href={guideHref(topic.slug)}
                className={`${linkClass} self-start font-medium`}
              >
                {topic.title}
              </Link>
              <p className="text-sm text-muted-foreground">{topic.summary}</p>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
