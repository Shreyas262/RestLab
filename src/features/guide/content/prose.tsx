import Link from "next/link";
import { guideHref, type GuideTopicSlug } from "../guide-topics";

export const linkClass =
  "rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em] break-words">
      {children}
    </code>
  );
}

export function Example({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-sm text-muted-foreground">{label}</figcaption>
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 font-mono text-sm">
        {children}
      </pre>
    </figure>
  );
}

export function TopicLink({
  slug,
  children,
}: {
  slug: GuideTopicSlug;
  children: React.ReactNode;
}) {
  return (
    <Link href={guideHref(slug)} className={linkClass}>
      {children}
    </Link>
  );
}

export function PageLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}
