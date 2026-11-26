import { screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { renderPlayground } from "./test-utils";

describe("Headers tab", () => {
  test("header rows are sent to the executor", async () => {
    const { user, tab, calls, sendTo } = renderPlayground();
    await user.click(tab("Headers"));
    await user.click(screen.getByRole("button", { name: "Add header" }));
    await user.keyboard("Accept");
    await user.type(
      screen.getByRole("textbox", { name: "Header 1 value" }),
      "application/json",
    );

    await sendTo();

    expect(calls[0].request.headers).toEqual([
      { key: "Accept", value: "application/json", enabled: true },
    ]);
  });

  test("an invalid header name blocks Send, switches to Headers, and focuses the field", async () => {
    const { user, tab, executor, sendTo } = renderPlayground();
    await user.click(tab("Headers"));
    await user.click(screen.getByRole("button", { name: "Add header" }));
    await user.keyboard("Bad Name");
    await user.click(tab("Params"));

    await sendTo();

    expect(executor).not.toHaveBeenCalled();
    expect(tab("Headers").getAttribute("aria-selected")).toBe("true");
    expect(tab("Headers").textContent).toContain("(has errors)");

    const name = screen.getByRole("textbox", { name: "Header 1 name" });
    const error = screen.getByText('"Bad Name" is not a valid header name.');
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(name.getAttribute("aria-describedby")).toContain(error.id);
    await waitFor(() => expect(document.activeElement).toBe(name));
  });

  test("a forbidden header shows a warning but does not block Send", async () => {
    const { user, tab, executor, sendTo } = renderPlayground();
    await user.click(tab("Headers"));
    await user.click(screen.getByRole("button", { name: "Add header" }));
    await user.keyboard("Cookie");

    const warning = screen.getByText(
      /Browsers don't let web pages set "Cookie"/,
    );
    expect(
      screen
        .getByRole("textbox", { name: "Header 1 name" })
        .getAttribute("aria-describedby"),
    ).toBe(warning.id);

    await sendTo();

    expect(executor).toHaveBeenCalledTimes(1);
  });

  test("a disabled forbidden header shows no warning", async () => {
    const { user, tab } = renderPlayground();
    await user.click(tab("Headers"));
    await user.click(screen.getByRole("button", { name: "Add header" }));
    await user.keyboard("Cookie");
    await user.click(screen.getByRole("checkbox", { name: "Enable header 1" }));

    expect(screen.queryByText(/Browsers don't let web pages set/)).toBeNull();
  });
});
