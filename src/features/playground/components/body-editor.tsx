import { useId } from "react";
import {
  useFormState,
  useWatch,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_TYPE_FOR_BODY } from "@/domain/request/body-rules";
import type { BodyType, RequestConfig } from "@/domain/request/schema";

const BODY_TYPE_LABELS: Readonly<Record<BodyType, string>> = {
  none: "None",
  json: "JSON",
  text: "Text",
};

interface BodyEditorProps {
  control: Control<RequestConfig>;
  register: UseFormRegister<RequestConfig>;
}

export function BodyEditor({ control, register }: BodyEditorProps) {
  const id = useId();
  const typeId = `${id}-type`;
  const contentId = `${id}-content`;
  const errorId = `${id}-error`;
  const [method, type] = useWatch({ control, name: ["method", "body.type"] });
  const { errors } = useFormState({ control, name: "body" });
  const contentError = errors.body?.content?.message;
  // ADR-017: GET keeps the body in the editor but never sends it.
  const isGet = method === "GET";

  return (
    <div className="flex flex-col gap-3">
      {isGet && (
        <p className="text-muted-foreground">
          GET requests don&apos;t send a body. Anything entered here is kept for
          other methods.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={typeId}>Body type</Label>
        {/* The DOM disabled attribute, not register's disabled option, which would drop the value on submit. */}
        <NativeSelect id={typeId} {...register("body.type")} disabled={isGet}>
          {Object.entries(BODY_TYPE_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {type !== "none" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={contentId}>Body</Label>
          <Textarea
            id={contentId}
            spellCheck={false}
            className="min-h-40 font-mono"
            aria-invalid={contentError ? true : undefined}
            aria-describedby={contentError ? errorId : undefined}
            {...register("body.content")}
            disabled={isGet}
          />
          {contentError && (
            <p id={errorId} className="text-destructive">
              {contentError}
            </p>
          )}
          {!isGet && (
            <p className="text-muted-foreground">
              <code className="font-mono">
                Content-Type: {CONTENT_TYPE_FOR_BODY[type]}
              </code>{" "}
              is added unless you set a Content-Type header.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
