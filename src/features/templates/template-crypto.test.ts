import { describe, expect, test } from "vitest";
import { base64ToBytes, bytesToBase64 } from "@/domain/response/base64";
import {
  encryptedTemplateSchema,
  type EncryptedTemplate,
} from "@/domain/templates/model";
import { makeRequest, row } from "@/test/fixtures/requests";
import {
  createTemplateKey,
  decryptTemplate,
  encryptTemplate,
  PBKDF2_ITERATIONS,
  unlockTemplate,
  type TemplateFields,
} from "./template-crypto";

// A low count keeps the suite fast. The stored count is what decryption uses.
const TEST_ITERATIONS = 1_000;
const PASSPHRASE = "correct horse battery";

const fields: TemplateFields = {
  id: "template-1",
  name: "Private API",
  createdAt: 1,
  updatedAt: 1,
};

const request = makeRequest({
  url: "https://api.example.com/private",
  method: "POST",
  headers: [row("Authorization", "Bearer secret-token")],
  body: { type: "json", content: '{"name":"value"}' },
});

async function encryptSample(): Promise<EncryptedTemplate> {
  const key = await createTemplateKey(PASSPHRASE, TEST_ITERATIONS);
  return encryptTemplate(fields, request, key);
}

function decodedCiphertext(template: EncryptedTemplate): string {
  return new TextDecoder().decode(base64ToBytes(template.ciphertext));
}

describe("template encryption (FR-03)", () => {
  test("uses the OWASP iteration count by default", async () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    const key = await createTemplateKey(PASSPHRASE);
    expect(key.iterations).toBe(600_000);
  });

  test("produces a record that matches the stored schema", async () => {
    const template = await encryptSample();
    expect(encryptedTemplateSchema.safeParse(template).success).toBe(true);
    expect(template).toMatchObject({
      ...fields,
      encrypted: true,
      encryption: { iterations: TEST_ITERATIONS },
    });
    expect(base64ToBytes(template.encryption.salt)).toHaveLength(16);
    expect(base64ToBytes(template.encryption.iv)).toHaveLength(12);
  });

  test("keeps the URL, headers, and body out of the stored record", async () => {
    const template = await encryptSample();
    const stored = JSON.stringify(template) + decodedCiphertext(template);
    expect(stored).not.toContain("api.example.com");
    expect(stored).not.toContain("secret-token");
    expect(stored).not.toContain("value");
  });

  test("round-trips the request with the same key", async () => {
    const key = await createTemplateKey(PASSPHRASE, TEST_ITERATIONS);
    const template = await encryptTemplate(fields, request, key);
    expect(await decryptTemplate(template, key)).toEqual({
      ok: true,
      value: request,
    });
  });

  test("uses a new salt for every key and a new IV for every encryption", async () => {
    const first = await createTemplateKey(PASSPHRASE, TEST_ITERATIONS);
    const second = await createTemplateKey(PASSPHRASE, TEST_ITERATIONS);
    expect(first.salt).not.toBe(second.salt);

    const a = await encryptTemplate(fields, request, first);
    const b = await encryptTemplate(fields, request, first);
    expect(a.encryption.iv).not.toBe(b.encryption.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
});

describe("unlockTemplate (FR-03)", () => {
  test("decrypts with the right passphrase and returns a reusable key", async () => {
    const template = await encryptSample();
    const unlocked = await unlockTemplate(template, PASSPHRASE);
    expect(unlocked.ok && unlocked.value.request).toEqual(request);

    if (!unlocked.ok) return;
    const updated = await encryptTemplate(
      { ...fields, updatedAt: 2 },
      makeRequest({ url: "https://api.example.com/changed" }),
      unlocked.value.key,
    );
    expect(updated.encryption.salt).toBe(template.encryption.salt);
    const again = await unlockTemplate(updated, PASSPHRASE);
    expect(again.ok && again.value.request.url).toBe(
      "https://api.example.com/changed",
    );
  });

  test("reports a wrong passphrase", async () => {
    const template = await encryptSample();
    const result = await unlockTemplate(template, "wrong passphrase");
    expect(result).toMatchObject({
      ok: false,
      error: { code: "WRONG_PASSPHRASE" },
    });
  });

  test("rejects a ciphertext that was altered", async () => {
    const template = await encryptSample();
    const bytes = base64ToBytes(template.ciphertext);
    bytes[0] = (bytes[0] ?? 0) ^ 0xff;
    const result = await unlockTemplate(
      { ...template, ciphertext: bytesToBase64(bytes) },
      PASSPHRASE,
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "WRONG_PASSPHRASE" },
    });
  });

  test("rejects a ciphertext copied into another record", async () => {
    const template = await encryptSample();
    const result = await unlockTemplate(
      { ...template, id: "template-2" },
      PASSPHRASE,
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "WRONG_PASSPHRASE" },
    });
  });

  test("reports damaged data when the decrypted content is not a request", async () => {
    const key = await createTemplateKey(PASSPHRASE, TEST_ITERATIONS);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: new TextEncoder().encode(fields.id),
      },
      key.key,
      new TextEncoder().encode('{"url":42}'),
    );
    const template: EncryptedTemplate = {
      ...fields,
      encrypted: true,
      encryption: {
        algorithm: "AES-GCM",
        kdf: "PBKDF2-SHA-256",
        iterations: key.iterations,
        salt: key.salt,
        iv: bytesToBase64(iv),
      },
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    };
    expect(await decryptTemplate(template, key)).toMatchObject({
      ok: false,
      error: { code: "INVALID_TEMPLATE" },
    });
  });
});
