import type { RequestConfig } from "@/domain/request/schema";

/** The editor's starting values. Strategy stays browser-direct until the selector ships in M6 (ADR-020). */
export const DEFAULT_REQUEST: RequestConfig = {
  url: "",
  method: "GET",
  params: [],
  headers: [],
  body: { type: "none", content: "" },
  strategy: "browser",
};
