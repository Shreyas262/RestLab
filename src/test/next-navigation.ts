import { vi } from "vitest";

/**
 * State behind the `next/navigation` mock in `setup.ts`. jsdom has no App Router,
 * so tests set the pathname and search params here before rendering.
 */
export const navigation = {
  pathname: "/",
  searchParams: new URLSearchParams(),
  replace: vi.fn<(href: string, options?: { scroll?: boolean }) => void>(),
};

export function resetNavigation() {
  navigation.pathname = "/";
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
}
