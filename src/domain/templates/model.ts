import { z } from "zod";
import { requestShape } from "@/domain/request/schema";

export const TEMPLATE_NAME_MAX_LENGTH = 100;
export const MAX_TEMPLATES = 50;
export const PASSPHRASE_MIN_LENGTH = 8;

export const templateNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name for the template.")
  .max(
    TEMPLATE_NAME_MAX_LENGTH,
    `Use at most ${TEMPLATE_NAME_MAX_LENGTH} characters.`,
  );

export const passphraseSchema = z
  .string()
  .min(
    PASSPHRASE_MIN_LENGTH,
    `Use at least ${PASSPHRASE_MIN_LENGTH} characters.`,
  );

const base64Schema = z.base64();

const templateMetaShape = {
  id: z.string().min(1),
  name: templateNameSchema,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
};

/**
 * Only the structure is checked, not `requestSchema`'s refinements, so a
 * half-finished request (for example a JSON body still being typed) can be
 * saved. Send validates it as usual (ADR-026).
 */
export const plainTemplateSchema = z.object({
  ...templateMetaShape,
  encrypted: z.literal(false),
  request: requestShape,
});

export const encryptionParamsSchema = z.object({
  algorithm: z.literal("AES-GCM"),
  kdf: z.literal("PBKDF2-SHA-256"),
  iterations: z.number().int().positive(),
  salt: base64Schema,
  iv: base64Schema,
});

export const encryptedTemplateSchema = z.object({
  ...templateMetaShape,
  encrypted: z.literal(true),
  encryption: encryptionParamsSchema,
  ciphertext: base64Schema,
});

export const storedTemplateSchema = z.discriminatedUnion("encrypted", [
  plainTemplateSchema,
  encryptedTemplateSchema,
]);

export type PlainTemplate = z.infer<typeof plainTemplateSchema>;
export type EncryptedTemplate = z.infer<typeof encryptedTemplateSchema>;
export type StoredTemplate = z.infer<typeof storedTemplateSchema>;
export type EncryptionParams = z.infer<typeof encryptionParamsSchema>;

/** Names are compared without case or surrounding spaces, so "Users" and "users " collide. */
export function sameTemplateName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function sortByRecentlyUpdated(
  templates: readonly StoredTemplate[],
): StoredTemplate[] {
  return [...templates].sort(
    (a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name),
  );
}
