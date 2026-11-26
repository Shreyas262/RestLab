import { XIcon } from "lucide-react";
import { useId, useRef } from "react";
import {
  Controller,
  useFieldArray,
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { RequestConfig } from "@/domain/request/schema";

interface KeyValueRowsProps {
  name: "params" | "headers";
  /** Lowercase singular, used in labels: "parameter", "header". */
  noun: string;
  control: Control<RequestConfig>;
  register: UseFormRegister<RequestConfig>;
  /** Non-blocking messages by row index. */
  warnings?: ReadonlyMap<number, string>;
}

export function KeyValueRows({
  name,
  noun,
  control,
  register,
  warnings,
}: KeyValueRowsProps) {
  const id = useId();
  const addButton = useRef<HTMLButtonElement>(null);
  const { fields, append, remove } = useFieldArray({ control, name });
  const { errors } = useFormState({ control, name });
  const rowErrors = errors[name];
  const label = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <p className="text-muted-foreground">No {noun}s added.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const n = index + 1;
            const keyError = rowErrors?.[index]?.key?.message;
            const valueError = rowErrors?.[index]?.value?.message;
            const warning = warnings?.get(index);
            const keyMessageId = `${id}-${field.id}-key-message`;
            const valueMessageId = `${id}-${field.id}-value-message`;
            const warningId = `${id}-${field.id}-warning`;
            const keyDescribedBy =
              [keyError && keyMessageId, warning && warningId]
                .filter(Boolean)
                .join(" ") || undefined;

            return (
              <li key={field.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                  <Controller
                    control={control}
                    name={`${name}.${index}.enabled`}
                    render={({ field: enabled }) => (
                      <Checkbox
                        ref={enabled.ref}
                        checked={enabled.value}
                        onCheckedChange={(checked) =>
                          enabled.onChange(checked === true)
                        }
                        onBlur={enabled.onBlur}
                        aria-label={`Enable ${noun} ${n}`}
                        className="mt-2"
                      />
                    )}
                  />
                  <Input
                    aria-label={`${label} ${n} name`}
                    placeholder="Name"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    aria-invalid={keyError ? true : undefined}
                    aria-describedby={keyDescribedBy}
                    {...register(`${name}.${index}.key`)}
                  />
                  <Input
                    aria-label={`${label} ${n} value`}
                    placeholder="Value"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    aria-invalid={valueError ? true : undefined}
                    aria-describedby={valueError ? valueMessageId : undefined}
                    {...register(`${name}.${index}.value`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${noun} ${n}`}
                    onClick={() => {
                      remove(index);
                      // The removed row held focus; move it somewhere predictable.
                      addButton.current?.focus();
                    }}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </div>
                {keyError && (
                  <p id={keyMessageId} className="text-destructive">
                    {keyError}
                  </p>
                )}
                {valueError && (
                  <p id={valueMessageId} className="text-destructive">
                    {valueError}
                  </p>
                )}
                {warning && (
                  <p id={warningId} className="text-muted-foreground">
                    <span className="font-medium">Warning:</span> {warning}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Button
        ref={addButton}
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          append(
            { key: "", value: "", enabled: true },
            { focusName: `${name}.${fields.length}.key` },
          )
        }
      >
        Add {noun}
      </Button>
    </div>
  );
}
