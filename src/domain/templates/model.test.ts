import { describe, expect, test } from "vitest";
import { makePlainTemplate } from "@/test/fixtures/templates";
import { makeRequest } from "@/test/fixtures/requests";
import {
  passphraseSchema,
  sameTemplateName,
  sortByRecentlyUpdated,
  storedTemplateSchema,
  templateNameSchema,
  TEMPLATE_NAME_MAX_LENGTH,
  type EncryptedTemplate,
} from "./model";

const encrypted: EncryptedTemplate = {
  id: "template-2",
  name: "Login",
  createdAt: 1,
  updatedAt: 2,
  encrypted: true,
  encryption: {
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA-256",
    iterations: 600_000,
    salt: "AAAAAAAAAAAAAAAAAAAAAA==",
    iv: "AAAAAAAAAAAAAAAA",
  },
  ciphertext: "q83vEjRWeJA=",
};

describe("storedTemplateSchema (FR-03)", () => {
  test("accepts a plain template", () => {
    expect(storedTemplateSchema.safeParse(makePlainTemplate()).success).toBe(
      true,
    );
  });

  test("accepts an encrypted template", () => {
    expect(storedTemplateSchema.safeParse(encrypted).success).toBe(true);
  });

  test("accepts a request that would not pass validation yet", () => {
    const draft = makePlainTemplate({
      request: makeRequest({
        url: "not a url",
        method: "POST",
        body: { type: "json", content: "{ unfinished" },
      }),
    });
    expect(storedTemplateSchema.safeParse(draft).success).toBe(true);
  });

  test.each([
    ["a missing request", { ...makePlainTemplate(), request: undefined }],
    [
      "an unknown method",
      {
        ...makePlainTemplate(),
        request: { ...makeRequest(), method: "TRACE" },
      },
    ],
    ["an empty name", makePlainTemplate({ name: "  " })],
    ["a negative timestamp", makePlainTemplate({ updatedAt: -1 })],
    [
      "a missing encrypted flag",
      { ...makePlainTemplate(), encrypted: undefined },
    ],
    [
      "an encrypted template with plain request data",
      { ...encrypted, ciphertext: undefined, request: makeRequest() },
    ],
    [
      "ciphertext that is not base64",
      { ...encrypted, ciphertext: "not base64!" },
    ],
    [
      "an unknown algorithm",
      {
        ...encrypted,
        encryption: { ...encrypted.encryption, algorithm: "AES-CBC" },
      },
    ],
    [
      "zero iterations",
      { ...encrypted, encryption: { ...encrypted.encryption, iterations: 0 } },
    ],
  ])("rejects %s", (_, value) => {
    expect(storedTemplateSchema.safeParse(value).success).toBe(false);
  });

  test("trims the name", () => {
    const parsed = storedTemplateSchema.parse(
      makePlainTemplate({ name: "  Users  " }),
    );
    expect(parsed.name).toBe("Users");
  });
});

describe("templateNameSchema and passphraseSchema (FR-03)", () => {
  test("limits the name length", () => {
    expect(
      templateNameSchema.safeParse("a".repeat(TEMPLATE_NAME_MAX_LENGTH))
        .success,
    ).toBe(true);
    expect(
      templateNameSchema.safeParse("a".repeat(TEMPLATE_NAME_MAX_LENGTH + 1))
        .success,
    ).toBe(false);
  });

  test("requires a passphrase of at least 8 characters", () => {
    expect(passphraseSchema.safeParse("1234567").success).toBe(false);
    expect(passphraseSchema.safeParse("12345678").success).toBe(true);
  });
});

describe("sameTemplateName (FR-03)", () => {
  test("ignores case and surrounding spaces", () => {
    expect(sameTemplateName("Users", " users ")).toBe(true);
    expect(sameTemplateName("Users", "User")).toBe(false);
  });
});

describe("sortByRecentlyUpdated (FR-03)", () => {
  test("puts the most recently updated first, then sorts by name", () => {
    const sorted = sortByRecentlyUpdated([
      makePlainTemplate({ id: "a", name: "Old", updatedAt: 1 }),
      makePlainTemplate({ id: "b", name: "Beta", updatedAt: 5 }),
      makePlainTemplate({ id: "c", name: "Alpha", updatedAt: 5 }),
    ]);
    expect(sorted.map((template) => template.name)).toEqual([
      "Alpha",
      "Beta",
      "Old",
    ]);
  });
});
