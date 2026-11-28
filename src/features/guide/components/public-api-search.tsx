"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_CATEGORIES, PUBLIC_APIS } from "../public-apis";
import { searchPublicApis } from "../search-public-apis";
import { ApiEntry, linkClass } from "./public-api-entry";

/**
 * The search field, the category links, and the entries. With an empty query it renders
 * the full list, so the prerendered page is complete without JavaScript.
 */
export function PublicApiSearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const results = searchPublicApis(PUBLIC_APIS, query);
  const categories = API_CATEGORIES.filter((category) =>
    results.some((api) => api.category === category.id),
  );
  const searching = query.trim() !== "";

  return (
    <>
      <div role="search" className="flex max-w-xl flex-col gap-2">
        <Label htmlFor={inputId}>Search APIs</Label>
        <Input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, topic, or URL, for example weather"
          autoComplete="off"
          spellCheck={false}
        />
        <p role="status" className="text-sm text-muted-foreground">
          {!searching
            ? `${PUBLIC_APIS.length} APIs`
            : results.length === 0
              ? `No APIs match “${query.trim()}”.`
              : `${results.length} of ${PUBLIC_APIS.length} APIs match.`}
        </p>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Categories">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <a href={`#${category.id}`} className={linkClass}>
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {categories.map((category) => (
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
            {results
              .filter((api) => api.category === category.id)
              .map((api) => (
                <li key={api.id}>
                  <ApiEntry api={api} />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}
