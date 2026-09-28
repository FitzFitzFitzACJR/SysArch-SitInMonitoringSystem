"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { reportIssueAction } from "../actions";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_LABELS, ReportIssueSchema, type ReportIssueInput } from "../schemas";

const OPTIONS = ISSUE_CATEGORIES.map((c) => ({ value: c, label: ISSUE_CATEGORY_LABELS[c] }));

export function ReportIssueDialog({ pcLabel }: { pcLabel: string }) {
  const [open, setOpen] = useState(false);
  const form = useForm<ReportIssueInput>({
    resolver: zodResolver(ReportIssueSchema),
    defaultValues: { category: undefined, description: "" },
  });

  async function onSubmit() {
    if (applyActionResult(form, await reportIssueAction(form.getValues()))) {
      toast.success("Thanks! The lab staff have been told.");
      form.reset({ category: undefined, description: "" });
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TriangleAlert /> Report a problem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report a problem with {pcLabel}</DialogTitle>
          <DialogDescription>
            Staff will be notified and the PC won&apos;t be given to anyone else until it&apos;s checked.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <SelectField control={form.control} name="category" label="What's wrong?" options={OPTIONS} />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="issue-description">Details</FieldLabel>
                  <Textarea
                    id="issue-description"
                    rows={3}
                    placeholder="e.g. The mouse cursor keeps freezing"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send report"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
