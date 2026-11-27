import { MAX_TEMPLATES } from "./model";

export const TEMPLATE_ERROR_CODES = [
  "STORAGE_UNAVAILABLE",
  "STORAGE_FULL",
  "STORAGE_ERROR",
  "TEMPLATE_LIMIT",
  "NAME_TAKEN",
  "NOT_FOUND",
  "INVALID_TEMPLATE",
  "WRONG_PASSPHRASE",
] as const;

export type TemplateErrorCode = (typeof TEMPLATE_ERROR_CODES)[number];

export interface TemplateError {
  code: TemplateErrorCode;
  message: string;
}

export const TEMPLATE_ERROR_MESSAGES: Readonly<
  Record<TemplateErrorCode, string>
> = {
  STORAGE_UNAVAILABLE:
    "Saved templates are not available in this browser. Private browsing or blocked site data can cause this.",
  STORAGE_FULL:
    "The browser has no room left for this template. Delete templates you no longer need and try again.",
  STORAGE_ERROR: "The browser could not read or save templates.",
  TEMPLATE_LIMIT: `You can save up to ${MAX_TEMPLATES} templates. Delete one to save another.`,
  NAME_TAKEN: "A template with this name already exists.",
  NOT_FOUND: "This template no longer exists. It may have been deleted.",
  INVALID_TEMPLATE:
    "This template's stored data is damaged and cannot be used.",
  WRONG_PASSPHRASE: "The passphrase is wrong, or the template data is damaged.",
};

export function createTemplateError(code: TemplateErrorCode): TemplateError {
  return { code, message: TEMPLATE_ERROR_MESSAGES[code] };
}

export type TemplateResult<T> =
  { ok: true; value: T } | { ok: false; error: TemplateError };

export function templateOk<T>(value: T): TemplateResult<T> {
  return { ok: true, value };
}

export function templateFailure<T>(code: TemplateErrorCode): TemplateResult<T> {
  return { ok: false, error: createTemplateError(code) };
}
