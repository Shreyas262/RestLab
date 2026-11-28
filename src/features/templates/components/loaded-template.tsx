interface LoadedTemplateProps {
  name: string | null;
  modified: boolean;
  saveError: string | null;
}

export function LoadedTemplate({
  name,
  modified,
  saveError,
}: LoadedTemplateProps) {
  if (!name && !saveError) return null;
  return (
    <div className="flex flex-col gap-1 text-sm">
      {name && (
        <p>
          <span className="text-muted-foreground">Template:</span>{" "}
          <span className="font-medium">{name}</span>
          {modified && <span> · Modified</span>}
        </p>
      )}
      {saveError && (
        <p role="alert" className="text-destructive">
          {saveError}
        </p>
      )}
    </div>
  );
}
