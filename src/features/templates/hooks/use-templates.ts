import { useEffect, useState } from "react";
import type { RequestConfig } from "@/domain/request/schema";
import {
  templateFailure,
  templateOk,
  type TemplateError,
  type TemplateResult,
} from "@/domain/templates/errors";
import type { StoredTemplate } from "@/domain/templates/model";
import {
  createTemplateKey,
  decryptTemplate,
  encryptTemplate,
  PBKDF2_ITERATIONS,
  unlockTemplate,
  type TemplateKey,
} from "../template-crypto";
import { openTemplateStore, type TemplateStore } from "../template-store";

/** Injected by tests; the app uses the browser's IndexedDB and the full iteration count. */
export interface TemplateServices {
  openStore: () => Promise<TemplateResult<TemplateStore>>;
  iterations: number;
}

export const DEFAULT_TEMPLATE_SERVICES: TemplateServices = {
  openStore: () => openTemplateStore(),
  iterations: PBKDF2_ITERATIONS,
};

export type TemplatesStatus = "loading" | "ready" | "unavailable";

export interface NewTemplate {
  name: string;
  request: RequestConfig;
  /** `null` stores the template without encryption. */
  passphrase: string | null;
}

export interface Templates {
  status: TemplatesStatus;
  /** Set when opening or listing failed. */
  error: TemplateError | null;
  templates: StoredTemplate[];
  damaged: number;
  isUnlocked(id: string): boolean;
  create(input: NewTemplate): Promise<TemplateResult<StoredTemplate>>;
  update(
    id: string,
    request: RequestConfig,
  ): Promise<TemplateResult<StoredTemplate>>;
  rename(id: string, name: string): Promise<TemplateResult<StoredTemplate>>;
  remove(id: string): Promise<TemplateResult<void>>;
  removeDamaged(): Promise<TemplateResult<number>>;
  /** Reads the latest stored copy. A locked template returns `LOCKED`. */
  load(id: string): Promise<TemplateResult<RequestConfig>>;
  unlock(
    id: string,
    passphrase: string,
  ): Promise<TemplateResult<RequestConfig>>;
  lock(id: string): void;
}

/**
 * Owns the template store connection and the keys of unlocked templates.
 * Keys live in state only, so a reload locks everything again (ADR-027).
 */
export function useTemplates(
  services: TemplateServices = DEFAULT_TEMPLATE_SERVICES,
): Templates {
  const [store, setStore] = useState<TemplateStore | null>(null);
  const [status, setStatus] = useState<TemplatesStatus>("loading");
  const [error, setError] = useState<TemplateError | null>(null);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [damaged, setDamaged] = useState(0);
  const [keys, setKeys] = useState<ReadonlyMap<string, TemplateKey>>(
    () => new Map(),
  );

  // IndexedDB is an external system and only exists in the browser, so it is opened after mount.
  useEffect(() => {
    let active = true;
    let opened: TemplateStore | null = null;
    void services.openStore().then(async (result) => {
      if (!result.ok) {
        if (active) {
          setStatus("unavailable");
          setError(result.error);
        }
        return;
      }
      if (!active) {
        result.value.close();
        return;
      }
      opened = result.value;
      const listed = await opened.list();
      if (!active) return;
      setStore(opened);
      setStatus("ready");
      if (listed.ok) {
        setTemplates(listed.value.templates);
        setDamaged(listed.value.skipped);
      } else {
        setError(listed.error);
      }
    });
    return () => {
      active = false;
      opened?.close();
    };
  }, [services]);

  async function refresh(current: TemplateStore): Promise<void> {
    const listed = await current.list();
    if (listed.ok) {
      setTemplates(listed.value.templates);
      setDamaged(listed.value.skipped);
      setError(null);
    } else {
      setError(listed.error);
    }
  }

  function setKey(id: string, key: TemplateKey | null): void {
    setKeys((current) => {
      const next = new Map(current);
      if (key) next.set(id, key);
      else next.delete(id);
      return next;
    });
  }

  /** Runs a write, then re-reads the list so it reflects what is stored, including other tabs' changes. */
  async function write<T>(
    run: (current: TemplateStore) => Promise<TemplateResult<T>>,
  ): Promise<TemplateResult<T>> {
    if (!store) return templateFailure("STORAGE_UNAVAILABLE");
    const result = await run(store);
    await refresh(store);
    return result;
  }

  async function readStored(
    current: TemplateStore,
    id: string,
  ): Promise<TemplateResult<StoredTemplate>> {
    const stored = await current.get(id);
    if (!stored.ok && stored.error.code === "NOT_FOUND") {
      await refresh(current);
    }
    return stored;
  }

  return {
    status,
    error,
    templates,
    damaged,
    isUnlocked: (id) => keys.has(id),

    create: ({ name, request, passphrase }) =>
      write(async (current) => {
        const now = Date.now();
        const fields = {
          id: crypto.randomUUID(),
          name,
          createdAt: now,
          updatedAt: now,
        };
        if (passphrase === null) {
          return current.create({ ...fields, encrypted: false, request });
        }
        const key = await createTemplateKey(passphrase, services.iterations);
        const created = await current.create(
          await encryptTemplate(fields, request, key),
        );
        if (created.ok) setKey(created.value.id, key);
        return created;
      }),

    update: (id, request) =>
      write(async (current) => {
        const stored = await current.get(id);
        if (!stored.ok) return stored;
        const template = stored.value;
        const updatedAt = Date.now();
        if (!template.encrypted) {
          return current.update({ ...template, request, updatedAt });
        }
        const key = keys.get(id);
        if (!key) return templateFailure("LOCKED");
        const fields = {
          id,
          name: template.name,
          createdAt: template.createdAt,
          updatedAt,
        };
        return current.update(await encryptTemplate(fields, request, key));
      }),

    rename: (id, name) =>
      write(async (current) => {
        const stored = await current.get(id);
        if (!stored.ok) return stored;
        // The name is not part of the encrypted data, so renaming needs no key.
        return current.update({ ...stored.value, name, updatedAt: Date.now() });
      }),

    remove: (id) =>
      write(async (current) => {
        const removed = await current.remove(id);
        if (removed.ok) setKey(id, null);
        return removed;
      }),

    removeDamaged: () => write((current) => current.removeDamaged()),

    async load(id) {
      if (!store) return templateFailure("STORAGE_UNAVAILABLE");
      const stored = await readStored(store, id);
      if (!stored.ok) return stored;
      const template = stored.value;
      if (!template.encrypted) return templateOk(template.request);
      const key = keys.get(id);
      return key ? decryptTemplate(template, key) : templateFailure("LOCKED");
    },

    async unlock(id, passphrase) {
      if (!store) return templateFailure("STORAGE_UNAVAILABLE");
      const stored = await readStored(store, id);
      if (!stored.ok) return stored;
      if (!stored.value.encrypted) return templateOk(stored.value.request);
      const unlocked = await unlockTemplate(stored.value, passphrase);
      if (!unlocked.ok) return unlocked;
      setKey(id, unlocked.value.key);
      return templateOk(unlocked.value.request);
    },

    lock: (id) => setKey(id, null),
  };
}
