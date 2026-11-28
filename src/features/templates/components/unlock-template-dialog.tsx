import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateResult } from "@/domain/templates/errors";

interface UnlockTemplateDialogProps {
  /** The template to unlock, or `null` when the dialog is closed. */
  templateName: string | null;
  onClose: () => void;
  onUnlock: (passphrase: string) => Promise<TemplateResult<unknown>>;
}

export function UnlockTemplateDialog({
  templateName,
  onClose,
  onUnlock,
}: UnlockTemplateDialogProps) {
  return (
    <Dialog
      open={templateName !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock “{templateName}”</DialogTitle>
          <DialogDescription>
            Enter the passphrase this template was saved with. It stays unlocked
            until you reload the page or lock it.
          </DialogDescription>
        </DialogHeader>
        <UnlockForm onUnlock={onUnlock} onDone={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function UnlockForm({
  onUnlock,
  onDone,
}: {
  onUnlock: UnlockTemplateDialogProps["onUnlock"];
  onDone: () => void;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  async function submit() {
    if (passphrase === "") {
      setError("Enter the passphrase.");
      return;
    }
    setUnlocking(true);
    const result = await onUnlock(passphrase);
    setUnlocking(false);
    if (result.ok) {
      onDone();
    } else {
      setError(result.error.message);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        // Portalled, but React still bubbles submit to any form around the trigger.
        event.stopPropagation();
        void submit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>Passphrase</Label>
        <Input
          id={id}
          type="password"
          autoComplete="current-password"
          value={passphrase}
          onChange={(event) => {
            setPassphrase(event.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} className="text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={unlocking}>
          {unlocking ? "Unlocking…" : "Unlock"}
        </Button>
      </DialogFooter>
    </form>
  );
}
