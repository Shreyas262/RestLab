import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { templateFailure } from "@/domain/templates/errors";
import { makeRequest, row } from "@/test/fixtures/requests";
import { fakeTemplateServices } from "@/test/template-services";
import { openTemplateStore } from "../template-store";
import { useTemplates, type TemplateServices } from "./use-templates";

const PASSPHRASE = "correct horse battery";
const request = makeRequest({
  url: "https://api.example.com/private",
  headers: [row("Authorization", "Bearer secret")],
});

async function renderTemplates(services: TemplateServices) {
  const hook = renderHook(() => useTemplates(services));
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
}

async function createEncrypted(
  hook: Awaited<ReturnType<typeof renderTemplates>>,
) {
  let id = "";
  await act(async () => {
    const created = await hook.result.current.create({
      name: "Private",
      request,
      passphrase: PASSPHRASE,
    });
    if (created.ok) id = created.value.id;
  });
  return id;
}

describe("useTemplates opening the store (FR-03)", () => {
  test("starts loading, then lists no templates", async () => {
    const hook = renderHook(() => useTemplates(fakeTemplateServices()));
    expect(hook.result.current.status).toBe("loading");
    await waitFor(() => expect(hook.result.current.status).toBe("ready"));
    expect(hook.result.current.templates).toEqual([]);
    expect(hook.result.current.error).toBeNull();
  });

  test("reports unavailable storage", async () => {
    const services: TemplateServices = {
      openStore: () => Promise.resolve(templateFailure("STORAGE_UNAVAILABLE")),
      iterations: 1,
    };
    const hook = renderHook(() => useTemplates(services));
    await waitFor(() => expect(hook.result.current.status).toBe("unavailable"));
    expect(hook.result.current.error?.code).toBe("STORAGE_UNAVAILABLE");

    let created;
    await act(async () => {
      created = await hook.result.current.create({
        name: "x",
        request,
        passphrase: null,
      });
    });
    expect(created).toMatchObject({
      ok: false,
      error: { code: "STORAGE_UNAVAILABLE" },
    });
  });
});

describe("useTemplates plain templates (FR-03)", () => {
  test("creates, lists, and loads a template", async () => {
    const hook = await renderTemplates(fakeTemplateServices());

    await act(async () => {
      await hook.result.current.create({
        name: "Users",
        request,
        passphrase: null,
      });
    });

    const [template] = hook.result.current.templates;
    expect(template).toMatchObject({ name: "Users", encrypted: false });
    expect(await hook.result.current.load(template?.id ?? "")).toEqual({
      ok: true,
      value: request,
    });
  });

  test("updates the request and renames", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    await act(async () => {
      await hook.result.current.create({
        name: "Users",
        request,
        passphrase: null,
      });
    });
    const id = hook.result.current.templates[0]?.id ?? "";
    const changed = makeRequest({ url: "https://api.example.com/changed" });

    await act(async () => {
      await hook.result.current.update(id, changed);
      await hook.result.current.rename(id, "All users");
    });

    expect(hook.result.current.templates[0]?.name).toBe("All users");
    expect(await hook.result.current.load(id)).toEqual({
      ok: true,
      value: changed,
    });
  });

  test("removes a template", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    await act(async () => {
      await hook.result.current.create({
        name: "Users",
        request,
        passphrase: null,
      });
    });
    const id = hook.result.current.templates[0]?.id ?? "";

    await act(async () => {
      await hook.result.current.remove(id);
    });

    expect(hook.result.current.templates).toEqual([]);
  });

  test("refreshes the list when a template was deleted elsewhere", async () => {
    const services = fakeTemplateServices();
    const hook = await renderTemplates(services);
    await act(async () => {
      await hook.result.current.create({
        name: "Users",
        request,
        passphrase: null,
      });
    });
    const id = hook.result.current.templates[0]?.id ?? "";

    // Another tab deletes it through its own connection.
    const other = await openTemplateStore(services.factory);
    if (other.ok) {
      await other.value.remove(id);
      other.value.close();
    }

    let loaded;
    await act(async () => {
      loaded = await hook.result.current.load(id);
    });
    expect(loaded).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(hook.result.current.templates).toEqual([]);
  });

  test("reports a name that is already taken", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    let second;
    await act(async () => {
      await hook.result.current.create({
        name: "Users",
        request,
        passphrase: null,
      });
      second = await hook.result.current.create({
        name: "users",
        request,
        passphrase: null,
      });
    });
    expect(second).toMatchObject({ ok: false, error: { code: "NAME_TAKEN" } });
    expect(hook.result.current.templates).toHaveLength(1);
  });
});

describe("useTemplates encrypted templates (FR-03)", () => {
  test("keeps a new encrypted template unlocked and loads it", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    const id = await createEncrypted(hook);

    expect(hook.result.current.templates[0]).toMatchObject({
      name: "Private",
      encrypted: true,
    });
    expect(hook.result.current.isUnlocked(id)).toBe(true);
    expect(await hook.result.current.load(id)).toEqual({
      ok: true,
      value: request,
    });
  });

  test("is locked again after a remount and unlocks with the passphrase", async () => {
    const services = fakeTemplateServices();
    const first = await renderTemplates(services);
    const id = await createEncrypted(first);
    first.unmount();

    const second = await renderTemplates(
      fakeTemplateServices(services.factory),
    );
    expect(second.result.current.isUnlocked(id)).toBe(false);
    expect(await second.result.current.load(id)).toMatchObject({
      ok: false,
      error: { code: "LOCKED" },
    });

    let wrong;
    await act(async () => {
      wrong = await second.result.current.unlock(id, "wrong passphrase");
    });
    expect(wrong).toMatchObject({
      ok: false,
      error: { code: "WRONG_PASSPHRASE" },
    });
    expect(second.result.current.isUnlocked(id)).toBe(false);

    let right;
    await act(async () => {
      right = await second.result.current.unlock(id, PASSPHRASE);
    });
    expect(right).toEqual({ ok: true, value: request });
    expect(second.result.current.isUnlocked(id)).toBe(true);
  });

  test("lock forgets the key, so updates need an unlock first", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    const id = await createEncrypted(hook);

    act(() => hook.result.current.lock(id));
    expect(hook.result.current.isUnlocked(id)).toBe(false);

    let updated;
    await act(async () => {
      updated = await hook.result.current.update(id, makeRequest());
    });
    expect(updated).toMatchObject({ ok: false, error: { code: "LOCKED" } });
  });

  test("re-encrypts an update with the unlocked key", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    const id = await createEncrypted(hook);
    const changed = makeRequest({ url: "https://api.example.com/changed" });

    await act(async () => {
      await hook.result.current.update(id, changed);
    });

    expect(await hook.result.current.load(id)).toEqual({
      ok: true,
      value: changed,
    });
  });

  test("renames a locked template without its passphrase", async () => {
    const hook = await renderTemplates(fakeTemplateServices());
    const id = await createEncrypted(hook);
    act(() => hook.result.current.lock(id));

    await act(async () => {
      await hook.result.current.rename(id, "Renamed");
    });

    expect(hook.result.current.templates[0]?.name).toBe("Renamed");
  });
});

describe("useTemplates damaged records (FR-03)", () => {
  test("counts damaged records and removes them", async () => {
    const services = fakeTemplateServices();
    const raw = services.factory.open("restlab", 1);
    raw.onupgradeneeded = () =>
      raw.result.createObjectStore("templates", { keyPath: "id" });
    await new Promise<void>((resolve) => {
      raw.onsuccess = () => {
        const transaction = raw.result.transaction("templates", "readwrite");
        transaction.objectStore("templates").put({ id: "broken" });
        transaction.oncomplete = () => {
          raw.result.close();
          resolve();
        };
      };
    });

    const hook = await renderTemplates(services);
    expect(hook.result.current.damaged).toBe(1);

    await act(async () => {
      await hook.result.current.removeDamaged();
    });
    expect(hook.result.current.damaged).toBe(0);
  });
});
