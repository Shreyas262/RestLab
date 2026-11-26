import type { FieldErrors } from "react-hook-form";
import { describe, expect, test } from "vitest";
import type { RequestConfig } from "@/domain/request/schema";
import { isRequestTab, tabToShowForErrors } from "./first-error-tab";

const headerError: FieldErrors<RequestConfig> = {
  headers: [{ key: { type: "custom", message: "bad name" } }],
};
const bodyError: FieldErrors<RequestConfig> = {
  body: { content: { type: "custom", message: "bad JSON" } },
};

describe("tabToShowForErrors", () => {
  test("keeps the active tab when there are no tab errors", () => {
    const urlOnly: FieldErrors<RequestConfig> = {
      url: { type: "custom", message: "Enter a URL." },
    };
    expect(tabToShowForErrors({}, "body")).toBe("body");
    expect(tabToShowForErrors(urlOnly, "headers")).toBe("headers");
  });

  test("keeps the active tab when it has an error", () => {
    expect(tabToShowForErrors({ ...headerError, ...bodyError }, "body")).toBe(
      "body",
    );
  });

  test("moves to the first tab with an error, in tab order", () => {
    expect(tabToShowForErrors(bodyError, "params")).toBe("body");
    expect(tabToShowForErrors({ ...bodyError, ...headerError }, "params")).toBe(
      "headers",
    );
  });
});

test("isRequestTab accepts only known tabs", () => {
  expect(isRequestTab("headers")).toBe(true);
  expect(isRequestTab("cookies")).toBe(false);
});
