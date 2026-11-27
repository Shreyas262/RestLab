import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { HTTP_METHODS } from "@/domain/request/schema";
import { failureResult, responseResult } from "@/execution/contract/result";
import { controllableExecutor } from "@/test/fake-executor";
import { makeResponse } from "@/test/fixtures/responses";
import { Playground } from "./playground";

function renderPlayground() {
  const user = userEvent.setup();
  const fake = controllableExecutor();
  render(<Playground executor={fake.executor} />);
  return {
    user,
    ...fake,
    method: () =>
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Method" }),
    url: () => screen.getByRole<HTMLInputElement>("textbox", { name: "URL" }),
    button: (name: "Send" | "Cancel") => screen.getByRole("button", { name }),
    status: () => screen.getByRole("status"),
  };
}

describe("Playground request bar (FR-01, FR-02)", () => {
  test("renders labelled controls with every supported method", () => {
    const { method, url, button, status } = renderPlayground();

    expect(Array.from(method().options, (option) => option.value)).toEqual([
      ...HTTP_METHODS,
    ]);
    expect(method().value).toBe("GET");
    expect(url().value).toBe("");
    expect(button("Send")).toBeDefined();
    expect(status().textContent).toBe("Send a request to see the response.");
  });

  test("shows the URL error next to the field and sends nothing", async () => {
    const { user, url, button, executor } = renderPlayground();

    await user.click(button("Send"));

    const error = screen.getByText("Enter a URL.");
    expect(url().getAttribute("aria-invalid")).toBe("true");
    expect(url().getAttribute("aria-describedby")).toBe(error.id);
    expect(executor).not.toHaveBeenCalled();
  });

  test("clears the URL error once the URL becomes valid", async () => {
    const { user, url, button } = renderPlayground();

    await user.type(url(), "not a url");
    await user.click(button("Send"));
    expect(
      screen.getByText("Enter a full URL, including http:// or https://."),
    ).toBeDefined();

    await user.clear(url());
    await user.type(url(), "https://api.example.com");

    expect(screen.queryByText(/Enter a full URL/)).toBeNull();
    expect(url().hasAttribute("aria-invalid")).toBe(false);
  });

  test("previews the final URL as the user types", async () => {
    const { user, url } = renderPlayground();

    expect(
      screen.getByText("Enter a valid URL to see the final request URL."),
    ).toBeDefined();

    await user.type(url(), "https://api.example.com/items?page=2");

    expect(
      screen.getByText("https://api.example.com/items?page=2"),
    ).toBeDefined();
  });
});

describe("Playground execution (FR-04, FR-07)", () => {
  test("sends the configured request and shows the response", async () => {
    const { user, method, url, button, status, executor, calls } =
      renderPlayground();

    await user.selectOptions(method(), "DELETE");
    await user.type(url(), "https://api.example.com/items/1");
    await user.click(button("Send"));

    expect(executor).toHaveBeenCalledTimes(1);
    expect(calls[0].request).toMatchObject({
      url: "https://api.example.com/items/1",
      method: "DELETE",
      strategy: "browser",
    });
    expect(status().textContent).toBe("Sending request…");
    expect(button("Cancel")).toBeDefined();

    await act(async () =>
      calls[0].settle(
        responseResult(makeResponse({ status: 404, statusText: "Not Found" })),
      ),
    );

    expect(status().textContent).toContain("HTTP error: 404 Not Found");
    expect(button("Send")).toBeDefined();
  });

  test("shows an execution failure and allows sending again", async () => {
    const { user, url, button, status, calls } = renderPlayground();

    await user.type(url(), "https://api.example.com");
    await user.click(button("Send"));
    await act(async () =>
      calls[0].settle(failureResult("NETWORK_ERROR", "browser")),
    );

    expect(status().textContent).toContain("Request failed:");
    expect(status().textContent).toContain("(NETWORK_ERROR)");
    expect(button("Send")).toBeDefined();
  });

  test("Cancel aborts the request, shows it as cancelled, and does not resubmit", async () => {
    const { user, url, button, status, executor, calls } = renderPlayground();

    await user.type(url(), "https://api.example.com");
    await user.click(button("Send"));
    await user.click(button("Cancel"));

    expect(calls[0].signal.aborted).toBe(true);
    expect(status().textContent).toBe("Request cancelled.");
    expect(button("Send")).toBeDefined();
    expect(executor).toHaveBeenCalledTimes(1);

    await act(async () => calls[0].settle(responseResult(makeResponse())));
    expect(status().textContent).toBe("Request cancelled.");
  });
});

describe("Playground keyboard use (NFR-06)", () => {
  test("moves through method, URL, and Send in order", async () => {
    const { user, method, url, button } = renderPlayground();

    await user.tab();
    expect(document.activeElement).toBe(method());
    await user.tab();
    expect(document.activeElement).toBe(url());
    await user.tab();
    expect(document.activeElement).toBe(button("Send"));
  });

  test("Enter in the URL field sends the request", async () => {
    const { user, url, executor } = renderPlayground();

    await user.type(url(), "https://api.example.com{Enter}");

    expect(executor).toHaveBeenCalledTimes(1);
  });

  test("focus stays on the action button when Send becomes Cancel and back", async () => {
    const { user, url, button, calls } = renderPlayground();

    await user.type(url(), "https://api.example.com");
    await user.tab();
    await user.keyboard("{Enter}");

    expect(document.activeElement).toBe(button("Cancel"));

    await user.keyboard("{Enter}");

    expect(calls[0].signal.aborted).toBe(true);
    expect(document.activeElement).toBe(button("Send"));
    expect(calls).toHaveLength(1);
  });
});
