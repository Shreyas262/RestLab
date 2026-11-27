import { requestShape, type RequestConfig } from "@/domain/request/schema";
import { base64ToBytes, bytesToBase64 } from "@/domain/response/base64";
import {
  templateFailure,
  templateOk,
  type TemplateResult,
} from "@/domain/templates/errors";
import type { EncryptedTemplate } from "@/domain/templates/model";

/** OWASP Password Storage Cheat Sheet value for PBKDF2-HMAC-SHA256 (ADR-027). */
export const PBKDF2_ITERATIONS = 600_000;
/** 128 bits, the minimum in NIST SP 800-132. */
const SALT_BYTES = 16;
/** 96 bits, the IV length AES-GCM is designed for. */
const IV_BYTES = 12;

/**
 * A derived key with the parameters it came from. The key is not extractable,
 * and it is kept only in memory, so a reload locks every template again.
 */
export interface TemplateKey {
  key: CryptoKey;
  salt: string;
  iterations: number;
}

export interface TemplateFields {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export async function createTemplateKey(
  passphrase: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<TemplateKey> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return {
    key: await deriveKey(passphrase, salt, iterations),
    salt: bytesToBase64(salt),
    iterations,
  };
}

/** Encrypts the request with a fresh IV. Reusing a key for an update keeps the passphrase unchanged. */
export async function encryptTemplate(
  fields: TemplateFields,
  request: RequestConfig,
  templateKey: TemplateKey,
): Promise<EncryptedTemplate> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: boundData(fields.id) },
    templateKey.key,
    new TextEncoder().encode(JSON.stringify(request)),
  );
  return {
    ...fields,
    encrypted: true,
    encryption: {
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations: templateKey.iterations,
      salt: templateKey.salt,
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptTemplate(
  template: EncryptedTemplate,
  templateKey: TemplateKey,
): Promise<TemplateResult<RequestConfig>> {
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(template.encryption.iv),
        additionalData: boundData(template.id),
      },
      templateKey.key,
      base64ToBytes(template.ciphertext),
    );
  } catch {
    // AES-GCM cannot tell a wrong key from altered data, so both get one message.
    return templateFailure("WRONG_PASSPHRASE");
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return templateFailure("INVALID_TEMPLATE");
  }
  const parsed = requestShape.safeParse(value);
  return parsed.success
    ? templateOk(parsed.data)
    : templateFailure("INVALID_TEMPLATE");
}

/** Derives the key from the passphrase and the template's own salt, then decrypts. */
export async function unlockTemplate(
  template: EncryptedTemplate,
  passphrase: string,
): Promise<TemplateResult<{ key: TemplateKey; request: RequestConfig }>> {
  const { salt, iterations } = template.encryption;
  const key: TemplateKey = {
    key: await deriveKey(passphrase, base64ToBytes(salt), iterations),
    salt,
    iterations,
  };
  const request = await decryptTemplate(template, key);
  return request.ok ? templateOk({ key, request: request.value }) : request;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Binding the ciphertext to its id stops it from being copied into another record.
function boundData(id: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(id);
}
