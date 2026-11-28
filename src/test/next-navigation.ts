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

/** Thrown by the mocked `notFound()`, as the real one throws to stop rendering. */
export const NOT_FOUND_ERROR = "NEXT_NOT_FOUND";

export function resetNavigation() {
  navigation.pathname = "/";
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
}
