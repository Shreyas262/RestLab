import { useId, type ReactNode } from "react";
import {
  useFormState,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { HTTP_METHODS, type RequestConfig } from "@/domain/request/schema";

interface RequestBarProps {
  control: Control<RequestConfig>;
  register: UseFormRegister<RequestConfig>;
  executing: boolean;
  onCancel: () => void;
  /** Extra buttons after Send, such as the template Save actions. */
  actions?: ReactNode;
}

export function RequestBar({
  control,
  register,
  executing,
  onCancel,
  actions,
}: RequestBarProps) {
  const id = useId();
  const methodId = `${id}-method`;
  const urlId = `${id}-url`;
  const urlErrorId = `${id}-url-error`;
  // useFormState instead of form.formState: a fresh object per change, so React Compiler memoization never serves stale errors.
  const { errors } = useFormState({ control, name: "url" });
  const urlError = errors.url?.message;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div>
        <Label htmlFor={methodId} className="sr-only">
          Method
        </Label>
        <NativeSelect
          id={methodId}
          className="font-mono"
          {...register("method")}
        >
          {HTTP_METHODS.map((method) => (
            <NativeSelectOption key={method} value={method}>
              {method}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Label htmlFor={urlId} className="sr-only">
          URL
        </Label>
        <Input
          id={urlId}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://api.example.com/items"
          className="font-mono"
          aria-invalid={urlError ? true : undefined}
          aria-describedby={urlError ? urlErrorId : undefined}
          {...register("url")}
        />
        {urlError && (
          <p id={urlErrorId} className="text-sm text-destructive">
            {urlError}
          </p>
        )}
      </div>

      {/* One element for both actions keeps keyboard focus in place when the label changes. */}
      {executing ? (
        <Button
          key="action"
          type="button"
          variant="outline"
          onClick={(event) => {
            // Stops the click from submitting the form if the button re-renders as Send before activation.
            event.preventDefault();
            onCancel();
          }}
        >
          Cancel
        </Button>
      ) : (
        <Button key="action" type="submit">
          Send
        </Button>
      )}
      {actions}
    </div>
  );
}
