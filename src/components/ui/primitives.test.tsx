import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Button } from "./button";
import { Label } from "./label";
import { NativeSelect, NativeSelectOption } from "./native-select";

test("a button can be focused with Tab and pressed with Enter", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Send</Button>);

  await user.tab();
  expect(screen.getByRole("button", { name: "Send" })).toBe(
    document.activeElement,
  );

  await user.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalledTimes(1);
});

test("a labelled native select changes value", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Label htmlFor="method">Method</Label>
      <NativeSelect id="method" defaultValue="GET">
        <NativeSelectOption value="GET">GET</NativeSelectOption>
        <NativeSelectOption value="POST">POST</NativeSelectOption>
      </NativeSelect>
    </>,
  );

  const select = screen.getByRole<HTMLSelectElement>("combobox", {
    name: "Method",
  });
  await user.selectOptions(select, "POST");

  expect(select.value).toBe("POST");
});
