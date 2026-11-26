import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { renderPlayground } from "./test-utils";

const BASE = "https://api.example.com/items";

describe("Params tab", () => {
  test("is the initially selected tab and starts empty", () => {
    const { tab } = renderPlayground();

    expect(tab("Params").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("No parameters added.")).toBeDefined();
  });

  test("adding a row focuses its name, and its values appear in the final URL", async () => {
    const { user, url } = renderPlayground();
    await user.type(url(), BASE);

    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Parameter 1 name" }),
    );

    await user.keyboard("q");
    await user.type(
      screen.getByRole("textbox", { name: "Parameter 1 value" }),
      "a b",
    );

    expect(screen.getByText(`${BASE}?q=a%20b`)).toBeDefined();
  });

  test("a disabled row is left out of the final URL and re-enabled with Space", async () => {
    const { user, url } = renderPlayground();
    await user.type(url(), BASE);
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    await user.keyboard("page");
    await user.type(
      screen.getByRole("textbox", { name: "Parameter 1 value" }),
      "2",
    );

    const enabled = screen.getByRole("checkbox", {
      name: "Enable parameter 1",
    });
    expect(enabled.getAttribute("aria-checked")).toBe("true");

    await user.click(enabled);
    expect(enabled.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByText(BASE)).toBeDefined();

    enabled.focus();
    await user.keyboard(" ");
    expect(enabled.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText(`${BASE}?page=2`)).toBeDefined();
  });

  test("a row with an empty name is ignored", async () => {
    const { user, url } = renderPlayground();
    await user.type(url(), BASE);
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    await user.type(
      screen.getByRole("textbox", { name: "Parameter 1 value" }),
      "orphan",
    );

    expect(screen.getByText(BASE)).toBeDefined();
  });

  test("removing a row updates the final URL and moves focus to Add", async () => {
    const { user, url } = renderPlayground();
    await user.type(url(), BASE);
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    await user.keyboard("a");
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    await user.keyboard("b");
    expect(screen.getByText(`${BASE}?a=&b=`)).toBeDefined();

    await user.click(
      screen.getByRole("button", { name: "Remove parameter 1" }),
    );

    expect(screen.getByText(`${BASE}?b=`)).toBeDefined();
    expect(
      screen.getByRole<HTMLInputElement>("textbox", {
        name: "Parameter 1 name",
      }).value,
    ).toBe("b");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add parameter" }),
    );
  });

  test("rows are sent to the executor with their enabled flags", async () => {
    const { user, calls, sendTo } = renderPlayground();
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
    await user.keyboard("q");
    await user.click(
      screen.getByRole("checkbox", { name: "Enable parameter 1" }),
    );

    await sendTo();

    expect(calls[0].request.params).toEqual([
      { key: "q", value: "", enabled: false },
    ]);
  });
});

describe("Request tabs keyboard use", () => {
  test("arrow keys move between tabs and show their panels", async () => {
    const { user, tab } = renderPlayground();

    tab("Params").focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Headers"));
    expect(tab("Headers").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("No headers added.")).toBeDefined();

    await user.keyboard("{ArrowRight}");
    expect(tab("Body").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("combobox", { name: "Body type" })).toBeDefined();
  });

  test("Tab reaches every control in a row", async () => {
    const { user, tab } = renderPlayground();
    await user.click(screen.getByRole("button", { name: "Add parameter" }));

    tab("Params").focus();
    await user.tab();
    // The panel itself is focusable, per the WAI-ARIA tabs pattern.
    expect(document.activeElement).toBe(screen.getByRole("tabpanel"));
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("checkbox", { name: "Enable parameter 1" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Parameter 1 name" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Parameter 1 value" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Remove parameter 1" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add parameter" }),
    );
  });
});
