import { screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { findPublicApi } from "@/features/guide/public-apis";
import { navigation } from "@/test/next-navigation";
import { renderPlayground } from "./test-utils";

function openSample(id: string) {
  navigation.searchParams = new URLSearchParams({ sample: id });
}

describe("Try it samples (FR-09, ADR-029)", () => {
  test("loads the named sample into the editor without sending it", async () => {
    openSample("jsonplaceholder");
    const { url, method, executor, user, tab } = renderPlayground();

    await waitFor(() =>
      expect(url().value).toBe("https://jsonplaceholder.typicode.com/posts"),
    );
    expect(method().value).toBe("GET");
    expect(
      screen.getByText("https://jsonplaceholder.typicode.com/posts?userId=1"),
    ).toBeDefined();
    await user.click(tab("Params"));
    expect(screen.getByDisplayValue("userId")).toBeDefined();
    expect(executor).not.toHaveBeenCalled();
  });

  test("shows the Body tab for a sample with a body", async () => {
    openSample("httpbin");
    const { method } = renderPlayground();

    await waitFor(() => expect(method().value).toBe("POST"));
    expect(
      screen.getByRole("tab", { name: /^Body/, selected: true }),
    ).toBeDefined();
    const sample = findPublicApi("httpbin")?.sample;
    expect(screen.getByRole("textbox", { name: "Body" })).toHaveProperty(
      "value",
      sample?.body.content,
    );
  });

  test("removes the parameter so a reload keeps the user's edits", async () => {
    openSample("jsonplaceholder");
    renderPlayground();

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/", { scroll: false }),
    );
  });

  test("ignores an unknown sample id and keeps the empty editor", async () => {
    openSample("no-such-api");
    const { url } = renderPlayground();

    await waitFor(() => expect(navigation.replace).toHaveBeenCalled());
    expect(url().value).toBe("");
  });

  test("leaves the URL alone when no sample is named", () => {
    const { url } = renderPlayground();

    expect(url().value).toBe("");
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
