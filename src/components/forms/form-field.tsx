"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";

type TextFieldProps<T extends FieldValues, TOut extends FieldValues = T> = {
  control: Control<T, unknown, TOut>;
  name: FieldPath<T>;
  label: string;
  description?: ReactNode;
} & Omit<ComponentProps<typeof Input>, "name">;

/** Label + input + error message, wired to react-hook-form with accessible ids. */
export function TextField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  description,
  ...input
}: TextFieldProps<T, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...input}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError id={`${name}-error`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

type SelectFieldProps<T extends FieldValues, TOut extends FieldValues = T> = {
  control: Control<T, unknown, TOut>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
};

export function SelectField<T extends FieldValues, TOut extends FieldValues = T>({
  control,
  name,
  label,
  placeholder,
  options,
}: SelectFieldProps<T, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value == null ? "" : String(field.value)}
            onValueChange={field.onChange}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} onBlur={field.onBlur} className="w-full">
              <SelectValue placeholder={placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/**
 * Copies server-side field errors (from the same Zod schema, or a DomainError) onto the form.
 * Returns true when the action succeeded.
 */
export function applyActionResult<T extends FieldValues, TOut extends FieldValues = T>(
  form: UseFormReturn<T, unknown, TOut>,
  result: ActionResult<unknown>,
) {
  if (result.ok) return true;
  for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
    form.setError(field as FieldPath<T>, { message: messages[0] });
  }
  form.setError("root", { message: result.error });
  return false;
}
