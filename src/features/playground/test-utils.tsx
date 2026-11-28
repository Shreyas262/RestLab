import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { controllableExecutor } from "@/test/fake-executor";
import { fakeTemplateServices } from "@/test/template-services";
import type { TemplateServices } from "@/features/templates/hooks/use-templates";
import { Playground } from "./playground";

/** Renders the playground with a fake executor and returns common queries. */
export function renderPlayground(
  templateServices: TemplateServices = fakeTemplateServices(),
) {
  const user = userEvent.setup();
  const fake = controllableExecutor();
  const { unmount } = render(
    <Playground executor={fake.executor} templateServices={templateServices} />,
  );

  return {
    user,
    unmount,
    ...fake,
    method: () =>
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Method" }),
    url: () => screen.getByRole<HTMLInputElement>("textbox", { name: "URL" }),
    send: () => screen.getByRole("button", { name: "Send" }),
    tab: (name: "Params" | "Headers" | "Body") =>
      screen.getByRole("tab", { name: new RegExp(`^${name}`) }),
    /** Types a valid URL and sends. */
    async sendTo(url = "https://api.example.com/items") {
      await user.type(screen.getByRole("textbox", { name: "URL" }), url);
      await user.click(screen.getByRole("button", { name: "Send" }));
    },
  };
}
