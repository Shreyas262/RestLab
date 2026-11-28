import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTemplateDialogProps {
  /** The template to delete, or `null` when the dialog is closed. */
  templateName: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTemplateDialog({
  templateName,
  onClose,
  onConfirm,
}: DeleteTemplateDialogProps) {
  return (
    <AlertDialog
      open={templateName !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{templateName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The template is removed from this browser. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
