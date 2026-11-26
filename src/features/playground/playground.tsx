"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { requestSchema, type RequestConfig } from "@/domain/request/schema";
import type { Executor } from "@/execution/contract/executor";
import { ExecutionOutput } from "./components/execution-output";
import { FinalUrlPreview } from "./components/final-url-preview";
import { RequestBar } from "./components/request-bar";
import { RequestTabs } from "./components/request-tabs";
import { DEFAULT_REQUEST } from "./default-request";
import { tabToShowForErrors, type RequestTab } from "./first-error-tab";
import { useExecution } from "./hooks/use-execution";

interface PlaygroundProps {
  /** Injected by tests; the page uses the default browser executor. */
  executor?: Executor;
}

export function Playground({ executor }: PlaygroundProps) {
  const { state, send, cancel } = useExecution(executor);
  const form = useForm<RequestConfig>({
    resolver: zodResolver(requestSchema),
    defaultValues: DEFAULT_REQUEST,
  });

  const [activeTab, setActiveTab] = useState<RequestTab>("params");

  const onSubmit = form.handleSubmit(
    (request) => send(request),
    (errors) => setActiveTab((current) => tabToShowForErrors(errors, current)),
  );

  return (
    <div className="flex flex-col gap-6">
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
        />
        <FinalUrlPreview control={form.control} />
        <RequestTabs
          control={form.control}
          register={form.register}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </form>
      <ExecutionOutput state={state} />
    </div>
  );
}
