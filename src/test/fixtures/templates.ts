import type { PlainTemplate } from "@/domain/templates/model";
import { makeRequest } from "./requests";

export function makePlainTemplate(
  overrides: Partial<PlainTemplate> = {},
): PlainTemplate {
  return {
    id: "template-1",
    name: "List items",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    encrypted: false,
    request: makeRequest(),
    ...overrides,
  };
}
