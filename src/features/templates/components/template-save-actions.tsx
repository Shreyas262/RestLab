import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RequestConfig } from "@/domain/request/schema";
import type { Templates } from "../hooks/use-templates";
import { SaveTemplateDialog } from "./save-template-dialog";

interface TemplateSaveActionsProps {
  templates: Templates;
  loadedId: string | null;
  getRequest: () => RequestConfig;
  onSaved: (id: string) => void;
  onError: (message: string | null) => void;
}

/**
 * Save updates the loaded template, or asks for a name and storage choice when
 * nothing is loaded. Both buttons are `type="button"` so they never send the request.
 */
export function TemplateSaveActions({
  templates,
  loadedId,
  getRequest,
  onSaved,
  onError,
}: TemplateSaveActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const loaded = templates.templates.find(({ id }) => id === loadedId) ?? null;
  const disabled = templates.status === "loading" || saving;

  async function save() {
    onError(null);
    if (!loaded) {
      setDialogOpen(true);
      return;
    }
    setSaving(true);
    const result = await templates.update(loaded.id, getRequest());
    setSaving(false);
    if (result.ok) onSaved(result.value.id);
    else onError(result.error.message);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
      {loaded && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => {
            onError(null);
            setDialogOpen(true);
          }}
        >
          Save as new
        </Button>
      )}
      <SaveTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={async ({ name, passphrase }) => {
          const result = await templates.create({
            name,
            passphrase,
            request: getRequest(),
          });
          if (result.ok) onSaved(result.value.id);
          return result;
        }}
      />
    </>
  );
}
