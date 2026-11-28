import {
  templateFailure,
  templateOk,
  type TemplateErrorCode,
  type TemplateResult,
} from "@/domain/templates/errors";
import {
  MAX_TEMPLATES,
  sameTemplateName,
  sortByRecentlyUpdated,
  storedTemplateSchema,
  type StoredTemplate,
} from "@/domain/templates/model";

const DB_NAME = "restlab";
const DB_VERSION = 1;
const STORE_NAME = "templates";

export interface TemplateList {
  templates: StoredTemplate[];
  /** Records that failed validation. They are left in place and not shown. */
  skipped: number;
}

export interface TemplateStore {
  list(): Promise<TemplateResult<TemplateList>>;
  get(id: string): Promise<TemplateResult<StoredTemplate>>;
  create(template: StoredTemplate): Promise<TemplateResult<StoredTemplate>>;
  update(template: StoredTemplate): Promise<TemplateResult<StoredTemplate>>;
  remove(id: string): Promise<TemplateResult<void>>;
  /** Deletes every record that fails validation and reports how many were removed. */
  removeDamaged(): Promise<TemplateResult<number>>;
  close(): void;
}

/** Opens the template database. `null` means the browser has no IndexedDB. */
export function openTemplateStore(
  factory: IDBFactory | null = typeof indexedDB === "undefined"
    ? null
    : indexedDB,
): Promise<TemplateResult<TemplateStore>> {
  if (!factory) return Promise.resolve(templateFailure("STORAGE_UNAVAILABLE"));

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(templateFailure("STORAGE_UNAVAILABLE"));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Lets a newer version in another tab upgrade the schema instead of being blocked.
      db.onversionchange = () => db.close();
      resolve(templateOk(createStore(db)));
    };
    request.onerror = () => resolve(templateFailure("STORAGE_UNAVAILABLE"));
  });
}

function createStore(db: IDBDatabase): TemplateStore {
  return {
    async list() {
      const records = await read(db, (store) => store.getAll());
      if (!records.ok) return records;
      const templates: StoredTemplate[] = [];
      let skipped = 0;
      for (const record of records.value) {
        const parsed = storedTemplateSchema.safeParse(record);
        if (parsed.success) templates.push(parsed.data);
        else skipped++;
      }
      return templateOk({
        templates: sortByRecentlyUpdated(templates),
        skipped,
      });
    },

    async get(id) {
      const record = await read(db, (store) => store.get(id));
      if (!record.ok) return record;
      if (record.value === undefined) return templateFailure("NOT_FOUND");
      const parsed = storedTemplateSchema.safeParse(record.value);
      return parsed.success
        ? templateOk(parsed.data)
        : templateFailure("INVALID_TEMPLATE");
    },

    create: (template) => write(db, template, "create"),
    update: (template) => write(db, template, "update"),

    remove(id) {
      return transact<void>(db, (store, control) => {
        store.delete(id).onsuccess = () => control.succeed(undefined);
      });
    },

    removeDamaged() {
      return transact<number>(db, (store, control) => {
        let removed = 0;
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) {
            control.succeed(removed);
            return;
          }
          if (!storedTemplateSchema.safeParse(cursor.value).success) {
            cursor.delete();
            removed++;
          }
          cursor.continue();
        };
      });
    },

    close: () => db.close(),
  };
}

function read<T>(
  db: IDBDatabase,
  makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<TemplateResult<T>> {
  return new Promise((resolve) => {
    let request: IDBRequest<T>;
    try {
      request = makeRequest(
        db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME),
      );
    } catch (error) {
      resolve(templateFailure(storageErrorCode(error)));
      return;
    }
    request.onsuccess = () => resolve(templateOk(request.result));
    request.onerror = () =>
      resolve(templateFailure(storageErrorCode(request.error)));
  });
}

interface TransactionControl<T> {
  /** The value reported once the transaction commits. */
  succeed(value: T): void;
  /** Refuses the write: the transaction is aborted and nothing is stored. */
  refuse(code: TemplateErrorCode): void;
}

/** Runs one transaction and resolves only when it has committed or aborted. */
function transact<T>(
  db: IDBDatabase,
  run: (store: IDBObjectStore, control: TransactionControl<T>) => void,
): Promise<TemplateResult<T>> {
  return new Promise((resolve) => {
    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readwrite");
    } catch (error) {
      resolve(templateFailure(storageErrorCode(error)));
      return;
    }
    let outcome: TemplateResult<T> | undefined;
    transaction.oncomplete = () =>
      resolve(outcome ?? templateFailure("STORAGE_ERROR"));
    // A failed request or a quota error also aborts the transaction; then its error decides the code.
    transaction.onabort = () =>
      resolve(
        outcome && !outcome.ok
          ? outcome
          : templateFailure(storageErrorCode(transaction.error)),
      );

    run(transaction.objectStore(STORE_NAME), {
      succeed: (value) => {
        outcome = templateOk(value);
      },
      refuse: (code) => {
        outcome = templateFailure(code);
        transaction.abort();
      },
    });
  });
}

function write(
  db: IDBDatabase,
  template: StoredTemplate,
  mode: "create" | "update",
): Promise<TemplateResult<StoredTemplate>> {
  const parsed = storedTemplateSchema.safeParse(template);
  if (!parsed.success) {
    return Promise.resolve(templateFailure("INVALID_TEMPLATE"));
  }
  const next = parsed.data;

  // The checks and the write share one transaction, so two tabs cannot both pass the limit or name check.
  return transact<StoredTemplate>(db, (store, control) => {
    const all = store.getAll();
    all.onsuccess = () => {
      const problem = checkWrite(all.result, next, mode);
      if (problem) {
        control.refuse(problem);
        return;
      }
      store.put(next).onsuccess = () => control.succeed(next);
    };
  });
}

function checkWrite(
  records: readonly unknown[],
  next: StoredTemplate,
  mode: "create" | "update",
): TemplateErrorCode | undefined {
  const others: StoredTemplate[] = [];
  let exists = false;
  for (const record of records) {
    const parsed = storedTemplateSchema.safeParse(record);
    if (!parsed.success) continue;
    if (parsed.data.id === next.id) exists = true;
    else others.push(parsed.data);
  }

  if (mode === "update" && !exists) return "NOT_FOUND";
  if (mode === "create" && exists) return "INVALID_TEMPLATE";
  // Damaged records still take up space, so they count toward the limit.
  if (mode === "create" && records.length >= MAX_TEMPLATES) {
    return "TEMPLATE_LIMIT";
  }
  if (others.some((other) => sameTemplateName(other.name, next.name))) {
    return "NAME_TAKEN";
  }
  return undefined;
}

export function storageErrorCode(error: unknown): TemplateErrorCode {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "STORAGE_FULL";
  }
  return "STORAGE_ERROR";
}
