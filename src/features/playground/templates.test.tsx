import { screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { templateFailure } from "@/domain/templates/errors";
import { PLAIN_TEXT_WARNING } from "@/features/templates/save-form";
import { fakeTemplateServices } from "@/test/template-services";
import { renderPlayground } from "./test-utils";

const PASSPHRASE = "correct horse battery";
const EMPTY_LIST = "No saved templates yet. Use Save next to Send.";

type Storage = "plain" | { passphrase: string; confirm?: string };

async function openSaveDialog(user: UserEvent, button = "Save") {
  await user.click(screen.getByRole("button", { name: button }));
  return screen.findByRole("dialog", { name: "Save as template" });
}

async function fillSaveDialog(
  user: UserEvent,
  dialog: HTMLElement,
  name: string,
  storage: Storage,
) {
  await user.type(within(dialog).getByRole("textbox", { name: "Name" }), name);
  if (storage === "plain") {
    await user.click(
      within(dialog).getByRole("radio", { name: "Save without encryption" }),
    );
  } else {
    await user.click(
      within(dialog).getByRole("radio", { name: "Encrypt with a passphrase" }),
    );
    await user.type(
      within(dialog).getByLabelText("Passphrase"),
      storage.passphrase,
    );
    await user.type(
      within(dialog).getByLabelText("Confirm passphrase"),
      storage.confirm ?? storage.passphrase,
    );
  }
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
}

async function saveAs(
  user: UserEvent,
  name: string,
  storage: Storage,
  button = "Save",
) {
  const dialog = await openSaveDialog(user, button);
  await fillSaveDialog(user, dialog, name, storage);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}

function templateButton(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name}`) });
}

/** Saves a template in one render, then renders again on the same database, like a reload. */
async function savedThenReloaded(storage: Storage) {
  const services = fakeTemplateServices();
  const first = renderPlayground(services);
  await screen.findByText(EMPTY_LIST);
  await first.user.type(first.url(), "https://api.example.com/users");
  await first.user.selectOptions(first.method(), "POST");
  await first.user.click(first.tab("Body"));
  await first.user.selectOptions(
    screen.getByRole("combobox", { name: "Body type" }),
    "json",
  );
  await first.user.type(
    screen.getByRole("textbox", { name: "Body" }),
    '{{"name":"Ada"}',
  );
  await saveAs(first.user, "Create user", storage);
  first.unmount();

  const second = renderPlayground(fakeTemplateServices(services.factory));
  await screen.findByRole("button", { name: /^Create user/ });
  return second;
}

describe("Saving templates (FR-03)", () => {
  test("starts with an empty list", async () => {
    renderPlayground();
    expect(await screen.findByText(EMPTY_LIST)).toBeDefined();
  });

  test("requires a storage choice, with neither option selected at first", async () => {
    const { user } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    const dialog = await openSaveDialog(user);

    for (const radio of within(dialog).getAllByRole("radio")) {
      expect((radio as HTMLInputElement).checked).toBe(false);
    }
    await user.type(
      within(dialog).getByRole("textbox", { name: "Name" }),
      "Users",
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(
      within(dialog).getByText("Choose how to store the template."),
    ).toBeDefined();
  });

  test("warns before saving without encryption", async () => {
    const { user } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    const dialog = await openSaveDialog(user);

    expect(within(dialog).queryByText(PLAIN_TEXT_WARNING)).toBeNull();
    await user.click(
      within(dialog).getByRole("radio", { name: "Save without encryption" }),
    );
    expect(within(dialog).getByText(PLAIN_TEXT_WARNING)).toBeDefined();
  });

  test("saves a plain template without sending the request", async () => {
    const { user, url, executor } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    await user.type(url(), "https://api.example.com/users");

    await saveAs(user, "Users", "plain");

    expect(templateButton("Users").textContent).toContain("GET");
    expect(screen.getByText("Template:").parentElement?.textContent).toBe(
      "Template: Users",
    );
    expect(executor).not.toHaveBeenCalled();
  });

  test("checks the passphrase fields", async () => {
    const { user } = renderPlayground();
    await screen.findByText(EMPTY_LIST);

    let dialog = await openSaveDialog(user);
    await fillSaveDialog(user, dialog, "Private", { passphrase: "short" });
    expect(
      within(dialog).getByText("Use at least 8 characters."),
    ).toBeDefined();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    dialog = await openSaveDialog(user);
    await fillSaveDialog(user, dialog, "Private", {
      passphrase: PASSPHRASE,
      confirm: "something else",
    });
    expect(
      within(dialog).getByText("The passphrases do not match."),
    ).toBeDefined();
  });

  test("saves an encrypted template that stays unlocked", async () => {
    const { user, url } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    await user.type(url(), "https://api.example.com/private");

    await saveAs(user, "Private", { passphrase: PASSPHRASE });

    expect(templateButton("Private").textContent).toContain("Unlocked");
  });

  test("shows a taken name next to the name field", async () => {
    const { user, url } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    await user.type(url(), "https://api.example.com/users");
    await saveAs(user, "Users", "plain");

    const dialog = await openSaveDialog(user, "Save as new");
    await fillSaveDialog(user, dialog, "users", "plain");

    expect(
      await within(dialog).findByText(
        "A template with this name already exists.",
      ),
    ).toBeDefined();
  });

  test("Save as new keeps the original and loads the copy", async () => {
    const { user, url } = renderPlayground();
    await screen.findByText(EMPTY_LIST);
    await user.type(url(), "https://api.example.com/users");
    await saveAs(user, "Users", "plain");

    await saveAs(user, "Users copy", "plain", "Save as new");

    expect(templateButton("Users ")).toBeDefined();
    expect(templateButton("Users copy").getAttribute("aria-current")).toBe(
      "true",
    );
  });
});

describe("Loading templates (FR-03)", () => {
  test("fills the editor, keeps it editable, and opens the Body tab", async () => {
    const { user, url, method, executor } = await savedThenReloaded("plain");

    await user.click(templateButton("Create user"));

    expect(url().value).toBe("https://api.example.com/users");
    expect(method().value).toBe("POST");
    expect(
      screen.getByRole("tab", { name: /^Body/ }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByRole<HTMLTextAreaElement>("textbox", {
        name: "Body",
      }).value,
    ).toBe('{"name":"Ada"}');
    expect(executor).not.toHaveBeenCalled();

    await user.clear(url());
    await user.type(url(), "https://api.example.com/other");
    expect(url().value).toBe("https://api.example.com/other");
  });

  test("marks edits as Modified and clears the marker on Save", async () => {
    const { user, url } = await savedThenReloaded("plain");
    await user.click(templateButton("Create user"));
    expect(screen.queryByText("· Modified")).toBeNull();

    await user.type(url(), "/1");
    expect(screen.getByText("· Modified")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByText("· Modified")).toBeNull());
  });

  test("sends the loaded values", async () => {
    const { user, send, calls } = await savedThenReloaded("plain");
    await user.click(templateButton("Create user"));

    await user.click(send());

    expect(calls[0]?.request).toMatchObject({
      url: "https://api.example.com/users",
      method: "POST",
      body: { type: "json", content: '{"name":"Ada"}' },
    });
  });
});

describe("Encrypted templates after a reload (FR-03)", () => {
  test("asks for the passphrase and rejects a wrong one", async () => {
    const { user, url } = await savedThenReloaded({ passphrase: PASSPHRASE });
    expect(templateButton("Create user").textContent).toContain("Locked");

    await user.click(templateButton("Create user"));
    const dialog = await screen.findByRole("dialog", {
      name: "Unlock “Create user”",
    });
    await user.type(
      within(dialog).getByLabelText("Passphrase"),
      "wrong passphrase",
    );
    await user.click(within(dialog).getByRole("button", { name: "Unlock" }));

    expect(
      await within(dialog).findByText(
        "The passphrase is wrong, or the template data is damaged.",
      ),
    ).toBeDefined();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(url().value).toBe("");
    expect(templateButton("Create user").textContent).toContain("Locked");
  });

  test("unlocks, loads, and locks again", async () => {
    const { user, url } = await savedThenReloaded({ passphrase: PASSPHRASE });

    await user.click(templateButton("Create user"));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Passphrase"), PASSPHRASE);
    await user.click(within(dialog).getByRole("button", { name: "Unlock" }));

    await waitFor(() =>
      expect(url().value).toBe("https://api.example.com/users"),
    );
    expect(templateButton("Create user").textContent).toContain("Unlocked");

    await user.click(screen.getByRole("button", { name: "Lock Create user" }));

    expect(templateButton("Create user").textContent).toContain("Locked");
    expect(screen.queryByText("Template:")).toBeNull();
  });
});

describe("Renaming and deleting templates (FR-03)", () => {
  test("renames in place and returns focus to Rename", async () => {
    const { user } = await savedThenReloaded("plain");

    await user.click(
      screen.getByRole("button", { name: "Rename Create user" }),
    );
    const input = screen.getByRole("textbox", {
      name: "New name for Create user",
    });
    await user.clear(input);
    await user.type(input, "Add user{Enter}");

    const rename = await screen.findByRole("button", {
      name: "Rename Add user",
    });
    expect(document.activeElement).toBe(rename);
  });

  test("Escape cancels a rename", async () => {
    const { user } = await savedThenReloaded("plain");

    await user.click(
      screen.getByRole("button", { name: "Rename Create user" }),
    );
    await user.keyboard("x{Escape}");

    expect(templateButton("Create user")).toBeDefined();
  });

  test("deletes only after confirmation", async () => {
    const { user } = await savedThenReloaded("plain");
    await user.click(templateButton("Create user"));

    await user.click(
      screen.getByRole("button", { name: "Delete Create user" }),
    );
    let dialog = await screen.findByRole("alertdialog", {
      name: "Delete “Create user”?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(templateButton("Create user")).toBeDefined();

    await user.click(
      screen.getByRole("button", { name: "Delete Create user" }),
    );
    dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText(EMPTY_LIST)).toBeDefined();
    expect(screen.queryByText("Template:")).toBeNull();
  });
});

describe("Template storage problems (FR-03)", () => {
  test("explains when storage is unavailable", async () => {
    renderPlayground({
      openStore: () => Promise.resolve(templateFailure("STORAGE_UNAVAILABLE")),
      iterations: 1,
    });

    expect(
      await screen.findByText(
        "Saved templates are not available in this browser. Private browsing or blocked site data can cause this.",
      ),
    ).toBeDefined();
  });
});
