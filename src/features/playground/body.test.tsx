import { screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { renderPlayground } from "./test-utils";

const bodyType = () =>
  screen.getByRole<HTMLSelectElement>("combobox", { name: "Body type" });
const bodyContent = () =>
  screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Body" });

describe("Body tab", () => {
  test("starts with no body and hides the editor", async () => {
    const { user, tab } = renderPlayground();
    await user.click(tab("Body"));

    expect(bodyType().value).toBe("none");
    expect(screen.queryByRole("textbox", { name: "Body" })).toBeNull();
  });

  test("is disabled for GET, and content survives switching methods", async () => {
    const { user, tab, method } = renderPlayground();
    await user.click(tab("Body"));
    await user.selectOptions(method(), "POST");
    await user.selectOptions(bodyType(), "text");
    await user.type(bodyContent(), "hello");

    await user.selectOptions(method(), "GET");

    expect(screen.getByText(/GET requests don't send a body/)).toBeDefined();
    expect(bodyType().disabled).toBe(true);
    expect(bodyContent().disabled).toBe(true);
    expect(bodyContent().value).toBe("hello");

    await user.selectOptions(method(), "PATCH");

    expect(bodyType().disabled).toBe(false);
    expect(bodyContent().disabled).toBe(false);
    expect(bodyContent().value).toBe("hello");
  });

  test("content is kept when the type is switched to None and back", async () => {
    const { user, tab, method } = renderPlayground();
    await user.click(tab("Body"));
    await user.selectOptions(method(), "POST");
    await user.selectOptions(bodyType(), "text");
    await user.type(bodyContent(), "kept");

    await user.selectOptions(bodyType(), "none");
    await user.selectOptions(bodyType(), "text");

    expect(bodyContent().value).toBe("kept");
  });

  test("sends the body with the request", async () => {
    const { user, tab, method, calls, sendTo } = renderPlayground();
    await user.click(tab("Body"));
    await user.selectOptions(method(), "PUT");
    await user.selectOptions(bodyType(), "json");
    await user.type(bodyContent(), '{{"id": 1}');

    expect(screen.getByText("Content-Type: application/json")).toBeDefined();

    await sendTo();

    expect(calls[0].request.method).toBe("PUT");
    expect(calls[0].request.body).toEqual({
      type: "json",
      content: '{"id": 1}',
    });
  });

  test("invalid JSON blocks Send, shows the error, and focuses the editor", async () => {
    const { user, tab, method, executor, sendTo } = renderPlayground();
    await user.click(tab("Body"));
    await user.selectOptions(method(), "POST");
    await user.selectOptions(bodyType(), "json");
    await user.type(bodyContent(), "{{not json");
    await user.click(tab("Params"));

    await sendTo();

    expect(executor).not.toHaveBeenCalled();
    expect(tab("Body").getAttribute("aria-selected")).toBe("true");
    const error = screen.getByText(/^The body is not valid JSON\./);
    expect(bodyContent().getAttribute("aria-invalid")).toBe("true");
    expect(bodyContent().getAttribute("aria-describedby")).toBe(error.id);
    await waitFor(() => expect(document.activeElement).toBe(bodyContent()));
  });

  test("GET with leftover invalid JSON still sends, with the content preserved", async () => {
    const { user, tab, method, calls, sendTo } = renderPlayground();
    await user.click(tab("Body"));
    await user.selectOptions(method(), "POST");
    await user.selectOptions(bodyType(), "json");
    await user.type(bodyContent(), "{{not json");
    await user.selectOptions(method(), "GET");

    await sendTo();

    expect(calls).toHaveLength(1);
    expect(calls[0].request.method).toBe("GET");
    expect(calls[0].request.body).toEqual({
      type: "json",
      content: "{not json",
    });
  });
});
