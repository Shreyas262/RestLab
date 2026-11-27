import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MAX_TEMPLATES } from "@/domain/templates/model";
import { makePlainTemplate } from "@/test/fixtures/templates";
import { makeRequest } from "@/test/fixtures/requests";
import {
  openTemplateStore,
  storageErrorCode,
  type TemplateStore,
} from "./template-store";

let factory: IDBFactory;
let store: TemplateStore;

async function open(): Promise<TemplateStore> {
  const opened = await openTemplateStore(factory);
  if (!opened.ok) throw new Error(opened.error.message);
  return opened.value;
}

/** Writes a record the schema rejects, as another version of the app or a damaged profile might. */
async function writeRaw(record: object): Promise<void> {
  const request = factory.open("restlab", 1);
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("templates", "readwrite");
    transaction.objectStore("templates").put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

beforeEach(async () => {
  // A fresh factory per test keeps databases from leaking between tests.
  factory = new IDBFactory();
  store = await open();
});

afterEach(() => {
  store.close();
});

describe("openTemplateStore (FR-03)", () => {
  test("reports that storage is unavailable without IndexedDB", async () => {
    expect(await openTemplateStore(null)).toMatchObject({
      ok: false,
      error: { code: "STORAGE_UNAVAILABLE" },
    });
  });

  test("reports that storage is unavailable when opening throws", async () => {
    const throwing = new IDBFactory();
    throwing.open = () => {
      throw new DOMException("denied", "SecurityError");
    };
    expect(await openTemplateStore(throwing)).toMatchObject({
      ok: false,
      error: { code: "STORAGE_UNAVAILABLE" },
    });
  });

  test("starts empty", async () => {
    expect(await store.list()).toEqual({
      ok: true,
      value: { templates: [], skipped: 0 },
    });
  });
});

describe("TemplateStore create, get, update, remove (FR-03)", () => {
  test("creates a template and reads it back", async () => {
    const template = makePlainTemplate();
    expect(await store.create(template)).toEqual({ ok: true, value: template });
    expect(await store.get(template.id)).toEqual({ ok: true, value: template });
  });

  test("keeps templates after the database is reopened", async () => {
    await store.create(makePlainTemplate());
    store.close();
    store = await open();
    const listed = await store.list();
    expect(listed.ok && listed.value.templates).toHaveLength(1);
  });

  test("lists the most recently updated first", async () => {
    await store.create(makePlainTemplate({ id: "a", name: "A", updatedAt: 1 }));
    await store.create(makePlainTemplate({ id: "b", name: "B", updatedAt: 3 }));
    await store.create(makePlainTemplate({ id: "c", name: "C", updatedAt: 2 }));
    const listed = await store.list();
    expect(listed.ok && listed.value.templates.map((t) => t.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  test("stores the trimmed name", async () => {
    const created = await store.create(makePlainTemplate({ name: "  Users " }));
    expect(created.ok && created.value.name).toBe("Users");
  });

  test("updates an existing template", async () => {
    const template = makePlainTemplate();
    await store.create(template);
    const changed = makePlainTemplate({
      name: "Renamed",
      updatedAt: template.updatedAt + 1,
      request: makeRequest({ url: "https://api.example.com/other" }),
    });
    expect((await store.update(changed)).ok).toBe(true);
    expect(await store.get(template.id)).toEqual({ ok: true, value: changed });
  });

  test("does not update a template that no longer exists", async () => {
    expect(await store.update(makePlainTemplate())).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
    const listed = await store.list();
    expect(listed.ok && listed.value.templates).toEqual([]);
  });

  test("removes a template", async () => {
    await store.create(makePlainTemplate());
    expect(await store.remove("template-1")).toEqual({
      ok: true,
      value: undefined,
    });
    expect(await store.get("template-1")).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });

  test("refuses a record that does not match the schema", async () => {
    expect(await store.create(makePlainTemplate({ name: "" }))).toMatchObject({
      ok: false,
      error: { code: "INVALID_TEMPLATE" },
    });
  });

  test("refuses to create a second record with the same id", async () => {
    await store.create(makePlainTemplate());
    expect(
      await store.create(makePlainTemplate({ name: "Other" })),
    ).toMatchObject({ ok: false, error: { code: "INVALID_TEMPLATE" } });
  });
});

describe("TemplateStore names and limits (FR-03)", () => {
  test("refuses a name that another template already uses", async () => {
    await store.create(makePlainTemplate({ id: "a", name: "Users" }));
    expect(
      await store.create(makePlainTemplate({ id: "b", name: " users" })),
    ).toMatchObject({ ok: false, error: { code: "NAME_TAKEN" } });
  });

  test("lets a template keep its own name on update", async () => {
    const template = makePlainTemplate();
    await store.create(template);
    expect(
      (await store.update({ ...template, updatedAt: template.updatedAt + 1 }))
        .ok,
    ).toBe(true);
  });

  test("refuses a rename to a name in use", async () => {
    await store.create(makePlainTemplate({ id: "a", name: "Users" }));
    await store.create(makePlainTemplate({ id: "b", name: "Posts" }));
    expect(
      await store.update(makePlainTemplate({ id: "b", name: "USERS" })),
    ).toMatchObject({ ok: false, error: { code: "NAME_TAKEN" } });
    const kept = await store.get("b");
    expect(kept.ok && kept.value.name).toBe("Posts");
  });

  test(`refuses more than ${MAX_TEMPLATES} templates`, async () => {
    for (let index = 0; index < MAX_TEMPLATES; index++) {
      await store.create(
        makePlainTemplate({ id: `t${index}`, name: `Template ${index}` }),
      );
    }
    expect(
      await store.create(makePlainTemplate({ id: "extra", name: "Extra" })),
    ).toMatchObject({ ok: false, error: { code: "TEMPLATE_LIMIT" } });
  });
});

describe("TemplateStore damaged records (FR-03)", () => {
  test("skips records that fail validation and counts them", async () => {
    await store.create(makePlainTemplate());
    await writeRaw({ id: "broken", name: 42 });
    expect(await store.list()).toMatchObject({
      ok: true,
      value: { templates: [{ id: "template-1" }], skipped: 1 },
    });
  });

  test("reports a damaged record on get", async () => {
    await writeRaw({ id: "broken", encrypted: false });
    expect(await store.get("broken")).toMatchObject({
      ok: false,
      error: { code: "INVALID_TEMPLATE" },
    });
  });

  test("lets a damaged record be removed", async () => {
    await writeRaw({ id: "broken" });
    expect((await store.remove("broken")).ok).toBe(true);
    expect(await store.list()).toMatchObject({ value: { skipped: 0 } });
  });
});

describe("storageErrorCode (FR-03)", () => {
  test("maps a quota error to STORAGE_FULL", () => {
    expect(
      storageErrorCode(new DOMException("full", "QuotaExceededError")),
    ).toBe("STORAGE_FULL");
  });

  test.each([new DOMException("x", "UnknownError"), new Error("x"), null])(
    "maps anything else to STORAGE_ERROR",
    (error) => {
      expect(storageErrorCode(error)).toBe("STORAGE_ERROR");
    },
  );
});
