import Link from "next/link";
import { buildFinalUrl } from "@/domain/request/build-url";
import { sampleHref, type PublicApi } from "../public-apis";

const KEY_LABELS: Readonly<Record<PublicApi["apiKey"], string>> = {
  none: "Not needed",
  optional: "Optional",
};

export const linkClass =
  "rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function ApiEntry({ api }: { api: PublicApi }) {
  const sampleUrl = buildFinalUrl(api.sample.url, api.sample.params);

  return (
    <article
      aria-labelledby={`api-${api.id}`}
      className="flex h-full min-w-0 flex-col gap-3 rounded-lg border p-4 text-sm"
    >
      <h3 id={`api-${api.id}`} className="text-base font-medium">
        {api.name}
      </h3>
      <p>{api.description}</p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        <dt className="text-muted-foreground">Base URL</dt>
        <dd className="font-mono break-all">{api.baseUrl}</dd>
        <dt className="text-muted-foreground">API key</dt>
        <dd>{KEY_LABELS[api.apiKey]}</dd>
        <dt className="text-muted-foreground">Browser-direct</dt>
        <dd>{api.browserDirect ? "Yes" : "No"}</dd>
        <dt className="text-muted-foreground">Last checked</dt>
        <dd>
          <time dateTime={api.lastChecked}>{api.lastChecked}</time>
        </dd>
        <dt className="text-muted-foreground">Sample</dt>
        <dd className="font-mono break-all">
          {api.sample.method} {sampleUrl}
        </dd>
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <Link
          href={sampleHref(api.id)}
          aria-label={`Try it with ${api.name}`}
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Try it
        </Link>
        <a
          href={api.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Documentation for ${api.name} (opens in a new tab)`}
          className={linkClass}
        >
          Documentation
        </a>
      </div>
    </article>
  );
}
