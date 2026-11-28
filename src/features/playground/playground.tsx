"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { requestSchema, type RequestConfig } from "@/domain/request/schema";
import type { Executor } from "@/execution/contract/executor";
import { LoadedTemplate } from "@/features/templates/components/loaded-template";
import { TemplateSaveActions } from "@/features/templates/components/template-save-actions";
import { TemplatesPanel } from "@/features/templates/components/templates-panel";
import {
  useTemplates,
  type TemplateServices,
} from "@/features/templates/hooks/use-templates";
import { FinalUrlPreview } from "./components/final-url-preview";
import { RequestBar } from "./components/request-bar";
import { RequestTabs } from "./components/request-tabs";
import { ResponseInspector } from "./components/response/response-inspector";
import { DEFAULT_REQUEST } from "./default-request";
import { tabToShowForErrors, type RequestTab } from "./first-error-tab";
import { useExecution } from "./hooks/use-execution";

interface PlaygroundProps {
  /** Injected by tests; the page uses the default browser executor. */
  executor?: Executor;
  /** Injected by tests; the page uses IndexedDB. Must keep the same identity between renders. */
  templateServices?: TemplateServices;
}

export function Playground({ executor, templateServices }: PlaygroundProps) {
  const { state, send, cancel } = useExecution(executor);
  const templates = useTemplates(templateServices);
  const form = useForm<RequestConfig>({
    resolver: zodResolver(requestSchema),
    defaultValues: DEFAULT_REQUEST,
  });
  // reset() makes the loaded template the form's defaults, so isDirty means "differs from the template".
  const { isDirty } = useFormState({ control: form.control });

  const [activeTab, setActiveTab] = useState<RequestTab>("params");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const loaded =
    templates.templates.find((template) => template.id === loadedId) ?? null;

  const onSubmit = form.handleSubmit(
    (request) => send(request),
    (errors) => setActiveTab((current) => tabToShowForErrors(errors, current)),
  );

  function loadTemplate(id: string, request: RequestConfig) {
    form.reset(request);
    setLoadedId(id);
    setSaveError(null);
    setActiveTab(request.body.type === "none" ? "params" : "body");
  }

  function markSaved(id: string) {
    form.reset(form.getValues());
    setLoadedId(id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <TemplatesPanel
        templates={templates}
        loadedId={loadedId}
        onLoad={loadTemplate}
        onDetach={(id) => {
          if (id === loadedId) setLoadedId(null);
        }}
      />
      <div className="flex min-w-0 flex-col gap-6">
        <form
          aria-label="Request"
          noValidate
          onSubmit={(event) => void onSubmit(event)}
          className="flex flex-col gap-3"
        >
          <RequestBar
            control={form.control}
            register={form.register}
            executing={state.status === "executing"}
            onCancel={cancel}
            actions={
              <TemplateSaveActions
                templates={templates}
                loadedId={loaded?.id ?? null}
                getRequest={() => form.getValues()}
                onSaved={markSaved}
                onError={setSaveError}
              />
            }
          />
          <LoadedTemplate
            name={loaded?.name ?? null}
            modified={isDirty}
            saveError={saveError}
          />
          <FinalUrlPreview control={form.control} />
          <RequestTabs
            control={form.control}
            register={form.register}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </form>
        <ResponseInspector state={state} />
      </div>
    </div>
  );
}
