import type { FieldErrors } from "react-hook-form";
import type { RequestConfig } from "@/domain/request/schema";

export const REQUEST_TABS = ["params", "headers", "body"] as const;
export type RequestTab = (typeof REQUEST_TABS)[number];

export function isRequestTab(value: string): value is RequestTab {
  return (REQUEST_TABS as readonly string[]).includes(value);
}

export function tabHasErrors(
  errors: FieldErrors<RequestConfig>,
  tab: RequestTab,
): boolean {
  return errors[tab] !== undefined;
}

/**
 * The tab to show after a failed Send. Inactive tab panels are unmounted, so an
 * error in one would otherwise be invisible. Stays put when the active tab has an error.
 */
export function tabToShowForErrors(
  errors: FieldErrors<RequestConfig>,
  active: RequestTab,
): RequestTab {
  if (tabHasErrors(errors, active)) return active;
  return REQUEST_TABS.find((tab) => tabHasErrors(errors, tab)) ?? active;
}
