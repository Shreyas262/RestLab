import Link from "next/link";
import { useId, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FailureResult } from "@/execution/contract/result";
import { GUIDE_PATH } from "@/features/guide/guide-topics";
import type { ExecutionState } from "../../hooks/use-execution";
import { BodyTab } from "./body-tab";
import { MetadataTab } from "./metadata-tab";
import { OverviewTab } from "./overview-tab";
import { ResponseSummary } from "./response-summary";

const RESPONSE_TABS = ["overview", "body", "metadata"] as const;
type ResponseTab = (typeof RESPONSE_TABS)[number];

const TAB_LABELS: Readonly<Record<ResponseTab, string>> = {
  overview: "Overview",
  body: "Body",
  metadata: "Metadata",
};

const linkClass =
  "rounded-sm text-foreground underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

function isResponseTab(value: string): value is ResponseTab {
  return (RESPONSE_TABS as readonly string[]).includes(value);
}

interface ResponseInspectorProps {
  state: ExecutionState;
}

/**
 * Only the short status line is a live region, so a large body is never read out.
 * The selected tab survives new responses.
 */
export function ResponseInspector({ state }: ResponseInspectorProps) {
  const headingId = useId();
  const [tab, setTab] = useState<ResponseTab>("body");
  const result = state.status === "completed" ? state.result : null;

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-3 text-sm"
    >
      <h2 id={headingId} className="font-medium">
        Response
      </h2>
      <div role="status" className="flex flex-col gap-1">
        {state.status === "idle" && (
          <p className="text-muted-foreground">
            Send a request to see the response.
          </p>
        )}
        {state.status === "executing" && <p>Sending request…</p>}
        {result?.kind === "response" && (
          <>
            <ResponseSummary response={result.response} />
            {result.response.processingError && (
              <p>
                <span className="font-medium">Processing error:</span>{" "}
                {result.response.processingError.message}
              </p>
            )}
          </>
        )}
        {result?.kind === "failure" && <FailureSummary result={result} />}
      </div>

      {state.status === "idle" && (
        <p className="text-muted-foreground">
          New here?{" "}
          <Link href={GUIDE_PATH} className={linkClass}>
            Read the guide
          </Link>{" "}
          or{" "}
          <Link href="/apis" className={linkClass}>
            try a public API
          </Link>
          .
        </p>
      )}

      {result?.kind === "response" && (
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isResponseTab(value)) setTab(value);
          }}
        >
          <TabsList aria-label="Response details">
            {RESPONSE_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {TAB_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab response={result.response} />
          </TabsContent>
          <TabsContent value="body">
            <BodyTab response={result.response} />
          </TabsContent>
          <TabsContent value="metadata">
            <MetadataTab response={result.response} />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

function FailureSummary({ result }: { result: FailureResult }) {
  const { code, message } = result.failure;
  if (code === "CANCELLED") return <p>{message}</p>;

  return (
    <p>
      <span className="font-medium">Request failed:</span> {message}{" "}
      <span className="font-mono text-muted-foreground">({code})</span>
    </p>
  );
}
