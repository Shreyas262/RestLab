import { IDBFactory } from "fake-indexeddb";
import type { TemplateServices } from "@/features/templates/hooks/use-templates";
import { openTemplateStore } from "@/features/templates/template-store";

/** A low count keeps encryption tests fast; records store the count they used. */
export const TEST_ITERATIONS = 1_000;

/**
 * Template services backed by a fresh in-memory IndexedDB. Pass the same
 * `factory` to a second call to simulate a reload with the data kept.
 */
export function fakeTemplateServices(
  factory: IDBFactory = new IDBFactory(),
): TemplateServices & { factory: IDBFactory } {
  return {
    factory,
    openStore: () => openTemplateStore(factory),
    iterations: TEST_ITERATIONS,
  };
}
