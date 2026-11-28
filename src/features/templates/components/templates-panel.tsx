import { cn } from "cn";
import { LockIcon, LockOpenIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequestConfig } from "@/domain/request/schema";
import { templateOk } from "@/domain/templates/errors";
import {
  templateNameSchema,
  type StoredTemplate,
} from "@/domain/templates/model";
import type { Templates } from "../hooks/use-templates";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { UnlockTemplateDialog } from "./unlock-template-dialog";

interface TemplatesPanelProps {
  templates: Templates;
  loadedId: string | null;
  onLoad: (id: string, request: RequestConfig) => void;
  /** Called after a template is locked or deleted, so the editor stops treating it as loaded. */
  onDetach: (id: string) => void;
}

export function TemplatesPanel({
  templates,
  loadedId,
  onLoad,
  onDetach,
}: TemplatesPanelProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const contentId = `${id}-content`;
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<StoredTemplate | null>(null);
  const [deleting, setDeleting] = useState<StoredTemplate | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  // Where focus goes after an inline rename closes, since the input it was in is gone.
  const [focusRenameOf, setFocusRenameOf] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { status, error, damaged } = templates;
  const list = templates.templates;

  async function load(template: StoredTemplate) {
    setActionError(null);
    if (template.encrypted && !templates.isUnlocked(template.id)) {
      setUnlocking(template);
      return;
    }
    const result = await templates.load(template.id);
    if (result.ok) onLoad(template.id, result.value);
    else setActionError(result.error.message);
  }

  async function confirmDelete(template: StoredTemplate) {
    const result = await templates.remove(template.id);
    if (result.ok) {
      onDetach(template.id);
      // The item and its Delete button are gone, so focus moves to the panel heading.
      headingRef.current?.focus();
    } else {
      setActionError(result.error.message);
    }
  }

  async function removeDamaged() {
    setActionError(null);
    const result = await templates.removeDamaged();
    if (!result.ok) setActionError(result.error.message);
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="font-medium outline-none"
        >
          Saved templates
        </h2>
        {/* Collapsible on small screens only; the sidebar is always open on wide ones. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Hide" : `Show (${list.length})`}
        </Button>
      </div>

      <div
        id={contentId}
        className={cn("flex-col gap-3 lg:flex", open ? "flex" : "hidden")}
      >
        {status === "loading" && (
          <p className="text-muted-foreground">Loading templates…</p>
        )}
        {error && <p className="text-destructive">{error.message}</p>}
        {status === "ready" && list.length === 0 && (
          <p className="text-muted-foreground">
            No saved templates yet. Use Save next to Send.
          </p>
        )}

        {list.length > 0 && (
          <ul className="flex flex-col gap-1">
            {list.map((template) =>
              renamingId === template.id ? (
                <li key={template.id}>
                  <RenameForm
                    template={template}
                    onCancel={() => {
                      setRenamingId(null);
                      setFocusRenameOf(template.id);
                    }}
                    onRename={async (name) => {
                      const result = await templates.rename(template.id, name);
                      if (!result.ok) return result.error.message;
                      setRenamingId(null);
                      setFocusRenameOf(template.id);
                      return null;
                    }}
                  />
                </li>
              ) : (
                <TemplateItem
                  key={template.id}
                  template={template}
                  loaded={template.id === loadedId}
                  unlocked={templates.isUnlocked(template.id)}
                  focusRename={focusRenameOf === template.id}
                  onLoad={() => void load(template)}
                  onRename={() => {
                    setActionError(null);
                    setRenamingId(template.id);
                  }}
                  onLock={() => {
                    templates.lock(template.id);
                    onDetach(template.id);
                  }}
                  onDelete={() => {
                    setActionError(null);
                    setDeleting(template);
                  }}
                />
              ),
            )}
          </ul>
        )}

        {damaged > 0 && (
          <div className="flex flex-col items-start gap-2">
            <p>
              {damaged === 1
                ? "1 saved record is damaged and cannot be shown."
                : `${damaged} saved records are damaged and cannot be shown.`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void removeDamaged()}
            >
              Delete damaged records
            </Button>
          </div>
        )}

        {actionError && (
          <p role="alert" className="text-destructive">
            {actionError}
          </p>
        )}
      </div>

      <UnlockTemplateDialog
        templateName={unlocking?.name ?? null}
        onClose={() => setUnlocking(null)}
        onUnlock={async (passphrase) => {
          if (!unlocking) return templateOk(undefined);
          const result = await templates.unlock(unlocking.id, passphrase);
          if (result.ok) onLoad(unlocking.id, result.value);
          return result;
        }}
      />
      <DeleteTemplateDialog
        templateName={deleting?.name ?? null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void confirmDelete(deleting);
        }}
      />
    </section>
  );
}

interface TemplateItemProps {
  template: StoredTemplate;
  loaded: boolean;
  unlocked: boolean;
  focusRename: boolean;
  onLoad: () => void;
  onRename: () => void;
  onLock: () => void;
  onDelete: () => void;
}

function TemplateItem({
  template,
  loaded,
  unlocked,
  focusRename,
  onLoad,
  onRename,
  onLock,
  onDelete,
}: TemplateItemProps) {
  const renameRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusRename) renameRef.current?.focus();
  }, [focusRename]);

  return (
    <li
      className={cn("flex items-center gap-1 rounded-lg", loaded && "bg-muted")}
    >
      <button
        type="button"
        onClick={onLoad}
        aria-current={loaded ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col items-start rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="w-full truncate font-medium">{template.name}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {template.encrypted ? (
            unlocked ? (
              <>
                <LockOpenIcon aria-hidden className="size-3" /> Unlocked
              </>
            ) : (
              <>
                <LockIcon aria-hidden className="size-3" /> Locked
              </>
            )
          ) : (
            // An encrypted template's method is part of the ciphertext, so only plain ones show it.
            <span className="font-mono">{template.request.method}</span>
          )}
          {loaded && <span>· Loaded</span>}
        </span>
      </button>
      {template.encrypted && unlocked && (
        <IconButton label={`Lock ${template.name}`} onClick={onLock}>
          <LockIcon />
        </IconButton>
      )}
      <IconButton
        ref={renameRef}
        label={`Rename ${template.name}`}
        onClick={onRename}
      >
        <PencilIcon />
      </IconButton>
      <IconButton label={`Delete ${template.name}`} onClick={onDelete}>
        <Trash2Icon />
      </IconButton>
    </li>
  );
}

function IconButton({
  ref,
  label,
  onClick,
  children,
}: {
  ref?: Ref<HTMLButtonElement>;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function RenameForm({
  template,
  onCancel,
  onRename,
}: {
  template: StoredTemplate;
  onCancel: () => void;
  /** Resolves to an error message, or `null` when the rename succeeded. */
  onRename: (name: string) => Promise<string | null>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [name, setName] = useState(template.name);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsed = templateNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a name.");
      return;
    }
    setError(await onRename(parsed.data));
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-1.5 px-1 py-1"
    >
      <Label htmlFor={id} className="sr-only">
        New name for {template.name}
      </Label>
      <Input
        id={id}
        autoFocus
        autoComplete="off"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-1">
        <Button type="submit" size="sm">
          Save name
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
