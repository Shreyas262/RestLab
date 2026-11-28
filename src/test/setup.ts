import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { navigation, resetNavigation } from "./next-navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({
    replace: navigation.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Testing Library only auto-cleans when test globals are enabled; this project keeps them off.
afterEach(() => {
  cleanup();
  resetNavigation();
});

// jsdom has no ResizeObserver; Radix primitives such as Checkbox measure themselves with it.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
