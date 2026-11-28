import { PublicApiSearch } from "./public-api-search";

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

      <PublicApiSearch />
    </div>
  );
}
