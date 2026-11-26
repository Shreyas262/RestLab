import { useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { findForbiddenHeaders } from "@/domain/request/forbidden-headers";
import type { RequestConfig } from "@/domain/request/schema";
import { KeyValueRows } from "./key-value-rows";

interface HeadersTabProps {
  control: Control<RequestConfig>;
  register: UseFormRegister<RequestConfig>;
}

export function HeadersTab({ control, register }: HeadersTabProps) {
  const [headers, strategy] = useWatch({
    control,
    name: ["headers", "strategy"],
  });
  const warnings = new Map(
    strategy === "browser"
      ? findForbiddenHeaders(headers).map(({ index, name }) => [
          index,
          `Browsers don't let web pages set "${name}". It won't be sent in browser-direct mode.`,
        ])
      : [],
  );

  return (
    <KeyValueRows
      name="headers"
      noun="header"
      control={control}
      register={register}
      warnings={warnings}
    />
  );
}
