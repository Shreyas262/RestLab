import { CircleAlertIcon } from "lucide-react";
import {
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RequestConfig } from "@/domain/request/schema";
import {
  isRequestTab,
  REQUEST_TABS,
  tabHasErrors,
  type RequestTab,
} from "../first-error-tab";
import { BodyEditor } from "./body-editor";
import { HeadersTab } from "./headers-tab";
import { KeyValueRows } from "./key-value-rows";

const TAB_LABELS: Readonly<Record<RequestTab, string>> = {
  params: "Params",
  headers: "Headers",
  body: "Body",
};

interface RequestTabsProps {
  control: Control<RequestConfig>;
  register: UseFormRegister<RequestConfig>;
  activeTab: RequestTab;
  onTabChange: (tab: RequestTab) => void;
}

export function RequestTabs({
  control,
  register,
  activeTab,
  onTabChange,
}: RequestTabsProps) {
  const { errors } = useFormState({ control });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isRequestTab(value)) onTabChange(value);
      }}
    >
      <TabsList aria-label="Request details">
        {REQUEST_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {TAB_LABELS[tab]}
            {tabHasErrors(errors, tab) && (
              <>
                <CircleAlertIcon
                  aria-hidden="true"
                  className="text-destructive"
                />
                <span className="sr-only"> (has errors)</span>
              </>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="params">
        <KeyValueRows
          name="params"
          noun="parameter"
          control={control}
          register={register}
        />
      </TabsContent>
      <TabsContent value="headers">
        <HeadersTab control={control} register={register} />
      </TabsContent>
      <TabsContent value="body">
        <BodyEditor control={control} register={register} />
      </TabsContent>
    </Tabs>
  );
}
