"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, applyActionResult } from "@/components/forms/form-field";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "../actions";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_LABELS,
  FeedbackSchema,
  type FeedbackFormValues,
  type FeedbackInput,
} from "../schemas";

export function FeedbackForm({ labs, defaultLabId }: { labs: { id: string; name: string }[]; defaultLabId?: string }) {
  const empty: FeedbackFormValues = {
    labId: defaultLabId ?? "",
    rating: 0,
    category: "EQUIPMENT",
    comments: "",
    suggestions: "",
  };
  const form = useForm<FeedbackFormValues, unknown, FeedbackInput>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: empty,
  });

  async function onSubmit() {
    if (applyActionResult(form, await submitFeedbackAction(form.getValues()))) {
      toast.success("Thanks for your feedback!");
      form.reset(empty);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="labId"
            label="Lab"
            options={labs.map((l) => ({ value: l.id, label: l.name }))}
          />
          <SelectField
            control={form.control}
            name="category"
            label="About"
            options={FEEDBACK_CATEGORIES.map((c) => ({ value: c, label: FEEDBACK_CATEGORY_LABELS[c] }))}
          />
        </div>
        <Controller
          control={form.control}
          name="rating"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Rating</FieldLabel>
              <StarRating
                name="rating"
                value={Number(field.value) || 0}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        {(["comments", "suggestions"] as const).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`feedback-${name}`}>
                  {name === "comments" ? "Comments" : "Suggestions (optional)"}
                </FieldLabel>
                <Textarea
                  id={`feedback-${name}`}
                  rows={name === "comments" ? 4 : 2}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ""}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
