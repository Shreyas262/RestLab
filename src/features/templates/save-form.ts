import { z } from "zod";
import { passphraseSchema, templateNameSchema } from "@/domain/templates/model";

export const STORAGE_CHOICES = ["encrypted", "plain"] as const;
export type StorageChoice = (typeof STORAGE_CHOICES)[number];

/** `""` means no choice yet: the dialog starts with neither option selected (ADR-027). */
export const saveFormSchema = z
  .object({
    name: templateNameSchema,
    storage: z.enum(["", ...STORAGE_CHOICES]),
    passphrase: z.string(),
    confirm: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.storage === "") {
      ctx.addIssue({
        code: "custom",
        path: ["storage"],
        message: "Choose how to store the template.",
      });
      return;
    }
    if (values.storage !== "encrypted") return;

    const passphrase = passphraseSchema.safeParse(values.passphrase);
    if (!passphrase.success) {
      ctx.addIssue({
        code: "custom",
        path: ["passphrase"],
        message: passphrase.error.issues[0]?.message ?? "Enter a passphrase.",
      });
    } else if (values.confirm !== values.passphrase) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm"],
        message: "The passphrases do not match.",
      });
    }
  });

export type SaveFormInput = z.input<typeof saveFormSchema>;
export type SaveFormValues = z.output<typeof saveFormSchema>;

export const EMPTY_SAVE_FORM: SaveFormInput = {
  name: "",
  storage: "",
  passphrase: "",
  confirm: "",
};

export const PLAIN_TEXT_WARNING =
  "Saved in this browser as plain text. Anyone or anything with access to this browser profile can read it, including tokens in headers.";

export const ENCRYPTION_NOTE =
  "A forgotten passphrase cannot be recovered. The template name stays readable.";
