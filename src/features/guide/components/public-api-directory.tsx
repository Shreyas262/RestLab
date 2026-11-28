import Link from "next/link";
import { buildFinalUrl } from "@/domain/request/build-url";
import {
  API_CATEGORIES,
  PUBLIC_APIS,
  sampleHref,
  type PublicApi,
} from "../public-apis";

const KEY_LABELS: Readonly<Record<PublicApi["apiKey"], string>> = {
  none: "Not needed",
  optional: "Optional",
};

const linkClass =
  "rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function PublicApiDirectory() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <h1 className="text-2xl font-semibold">Public APIs</h1>
        <p className="text-muted-foreground">
          Free APIs that answer requests sent straight from the browser. Try it
          opens the playground with a sample request in the editor. Nothing is
          sent until you press Send, and you can change the sample or save it as
          a template.
        </p>
        <p className="text-muted-foreground">
          These are third-party services. They can change, slow down, or go
          offline, so each entry shows when it was last checked. If a sample
          stops working, check the API&apos;s documentation.
        </p>
      </div>

      <nav aria-label="Categories">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {API_CATEGORIES.map((category) => (
            <li key={category.id}>
              <a href={`#${category.id}`} className={linkClass}>
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {API_CATEGORIES.map((category) => (
        <section
          key={category.id}
          id={category.id}
          aria-labelledby={`${category.id}-heading`}
          className="flex scroll-mt-4 flex-col gap-4"
        >
          <h2 id={`${category.id}-heading`} className="text-lg font-medium">
            {category.name}
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {PUBLIC_APIS.filter((api) => api.category === category.id).map(
              (api) => (
                <li key={api.id}>
                  <ApiEntry api={api} />
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ApiEntry({ api }: { api: PublicApi }) {
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
