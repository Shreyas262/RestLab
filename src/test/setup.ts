import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans when test globals are enabled; this project keeps them off.
afterEach(() => {
  cleanup();
});

// jsdom has no ResizeObserver; Radix primitives such as Checkbox measure themselves with it.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
