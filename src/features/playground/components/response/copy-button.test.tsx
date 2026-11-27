import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { COPY_FEEDBACK_MS, CopyButton } from "./copy-button";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CopyButton (FR-05, NFR-06)", () => {
  test("copies the text and confirms inline, then resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CopyButton text="hello" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await navigator.clipboard.readText()).toBe("hello");
    expect(screen.getByRole("button", { name: "Copied" })).toBeDefined();

    act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS));
    expect(screen.getByRole("button", { name: "Copy" })).toBeDefined();
  });

  test("says when copying failed", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(<CopyButton text="hello" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("button", { name: "Copy failed" })).toBeDefined();
  });

  test("can be pressed with the keyboard", async () => {
    const user = userEvent.setup();
    render(<CopyButton text="keyboard" />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(await navigator.clipboard.readText()).toBe("keyboard");
  });
});
