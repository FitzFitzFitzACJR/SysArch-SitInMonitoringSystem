"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction, updateAnnouncementAction } from "../actions";
import { AnnouncementSchema, type AnnouncementFormValues, type AnnouncementInput } from "../schemas";

type Option = { id: string; name: string };

const EMPTY: AnnouncementFormValues = {
  title: "",
  body: "",
  pinned: false,
  publishAt: "",
  expiresAt: "",
  audience: "ALL",
  labId: "",
  courseId: "",
};

export function AnnouncementDialog({
  labs,
  courses,
  announcement,
}: {
  labs: Option[];
  courses: Option[];
  announcement?: AnnouncementFormValues & { id: string };
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<AnnouncementFormValues, unknown, AnnouncementInput>({
    resolver: zodResolver(AnnouncementSchema),
    defaultValues: announcement ?? EMPTY,
  });
  const audience = useWatch({ control: form.control, name: "audience" });

  async function onSubmit() {
    const raw = form.getValues();
    const result = announcement
      ? await updateAnnouncementAction({ ...raw, id: announcement.id })
      : await createAnnouncementAction(raw);
    if (!applyActionResult(form, result)) return;
    toast.success(announcement ? "Announcement updated" : "Announcement posted");
    if (!announcement) form.reset(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {announcement ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${announcement.title}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus /> New announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{announcement ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>Plain text; line breaks are kept.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <TextField control={form.control} name="title" label="Title" />
            <Controller
              control={form.control}
              name="body"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="announcement-body">Message</FieldLabel>
                  <Textarea id="announcement-body" rows={6} aria-invalid={fieldState.invalid} {...field} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <SelectField
              control={form.control}
              name="audience"
              label="Who should see it"
              options={[
                { value: "ALL", label: "All students" },
                { value: "LAB", label: "Students using one lab" },
                { value: "COURSE", label: "Students in one course" },
              ]}
            />
            {audience === "LAB" && (
              <SelectField
                control={form.control}
                name="labId"
                label="Lab"
                options={labs.map((l) => ({ value: l.id, label: l.name }))}
              />
            )}
            {audience === "COURSE" && (
              <SelectField
                control={form.control}
                name="courseId"
                label="Course"
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="publishAt"
                label="Publish at"
                type="datetime-local"
                description="Empty = now"
              />
              <TextField
                control={form.control}
                name="expiresAt"
                label="Hide after"
                type="datetime-local"
                description="Empty = never"
              />
            </div>
            <Controller
              control={form.control}
              name="pinned"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="announcement-pinned">Pin to the top</FieldLabel>
                    <FieldDescription>Pinned posts stay above newer ones.</FieldDescription>
                  </FieldContent>
                  <Switch id="announcement-pinned" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : announcement ? "Save" : "Post"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
