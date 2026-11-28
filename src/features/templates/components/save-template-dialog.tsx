import { zodResolver } from "@hookform/resolvers/zod";
import { useId, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  ENCRYPTION_NOTE,
  EMPTY_SAVE_FORM,
  PLAIN_TEXT_WARNING,
  saveFormSchema,
  type SaveFormInput,
  type SaveFormValues,
} from "../save-form";

export interface SaveTemplateRequest {
  name: string;
  /** `null` saves without encryption. */
  passphrase: string | null;
}

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (request: SaveTemplateRequest) => Promise<TemplateResult<unknown>>;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  onSave,
}: SaveTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <DialogDescription>
            Templates are saved in this browser only.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from an empty form. */}
        <SaveTemplateForm onSave={onSave} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SaveTemplateForm({
  onSave,
  onDone,
}: {
  onSave: SaveTemplateDialogProps["onSave"];
  onDone: () => void;
}) {
  const id = useId();
  const form = useForm<SaveFormInput, unknown, SaveFormValues>({
    resolver: zodResolver(saveFormSchema),
    defaultValues: EMPTY_SAVE_FORM,
  });
  const { errors, isSubmitting } = form.formState;
  const storage = useWatch({ control: form.control, name: "storage" });

  const submit = form.handleSubmit(async (values) => {
    const result = await onSave({
      name: values.name,
      passphrase: values.storage === "encrypted" ? values.passphrase : null,
    });
    if (result.ok) {
      onDone();
    } else if (result.error.code === "NAME_TAKEN") {
      form.setError("name", { message: result.error.message });
    } else {
      form.setError("root", { message: result.error.message });
    }
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // The dialog is portalled, but React still bubbles submit to the request form around the Save button.
        event.stopPropagation();
        void submit(event);
      }}
      className="flex flex-col gap-4"
    >
      <Field
        id={`${id}-name`}
        label="Name"
        error={errors.name?.message}
        input={(props) => (
          <Input autoComplete="off" {...props} {...form.register("name")} />
        )}
      />

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={errors.storage ? `${id}-storage-error` : undefined}
      >
        <legend className="mb-2 font-medium">Storage</legend>
        <label className="flex items-center gap-2">
          <input type="radio" value="encrypted" {...form.register("storage")} />
          Encrypt with a passphrase
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="plain" {...form.register("storage")} />
          Save without encryption
        </label>
        {errors.storage && (
          <p id={`${id}-storage-error`} className="text-destructive">
            {errors.storage.message}
          </p>
        )}
      </fieldset>

      {storage === "encrypted" && (
        <div className="flex flex-col gap-3">
          <Field
            id={`${id}-passphrase`}
            label="Passphrase"
            error={errors.passphrase?.message}
            input={(props) => (
              <Input
                type="password"
                autoComplete="new-password"
                {...props}
                {...form.register("passphrase")}
              />
            )}
          />
          <Field
            id={`${id}-confirm`}
            label="Confirm passphrase"
            error={errors.confirm?.message}
            input={(props) => (
              <Input
                type="password"
                autoComplete="new-password"
                {...props}
                {...form.register("confirm")}
              />
            )}
          />
          <p className="text-muted-foreground">{ENCRYPTION_NOTE}</p>
        </div>
      )}

      {storage === "plain" && (
        <p className="rounded-lg border border-destructive/40 p-3">
          <span className="font-medium">Warning:</span> {PLAIN_TEXT_WARNING}
        </p>
      )}

      {errors.root && (
        <p role="alert" className="text-destructive">
          {errors.root.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? storage === "encrypted"
              ? "Encrypting…"
              : "Saving…"
            : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface FieldInputProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

function Field({
  id,
  label,
  error,
  input,
}: {
  id: string;
  label: string;
  error: string | undefined;
  input: (props: FieldInputProps) => ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {input({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
