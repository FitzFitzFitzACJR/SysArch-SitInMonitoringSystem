"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { createSemesterAction, updateSemesterAction } from "../actions";
import { SemesterSchema, type SemesterFormValues, type SemesterInput } from "../schemas";

export function SemesterDialog({
  semester,
  defaultSessions,
  started,
}: {
  semester?: SemesterFormValues & { id: string };
  defaultSessions: number;
  started?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const empty: SemesterFormValues = { name: "", startsOn: "", endsOn: "", sessionAllotment: String(defaultSessions) };
  const form = useForm<SemesterFormValues, unknown, SemesterInput>({
    resolver: zodResolver(SemesterSchema),
    defaultValues: semester ?? empty,
  });

  async function onSubmit() {
    const raw = form.getValues();
    const result = semester ? await updateSemesterAction({ ...raw, id: semester.id }) : await createSemesterAction(raw);
    if (!applyActionResult(form, result)) return;
    toast.success(semester ? "Semester updated" : "Semester created");
    if (!semester) form.reset(empty);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {semester ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${semester.name}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus /> New semester
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{semester ? "Edit semester" : "New semester"}</DialogTitle>
          <DialogDescription>
            When it starts, every active student&apos;s remaining sessions are set to the allotment (recorded in each
            student&apos;s history). Past semesters stay as an archive.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <TextField control={form.control} name="name" label="Name" placeholder="2nd Semester AY 2026–2027" />
            <div className="grid grid-cols-2 gap-4">
              <TextField control={form.control} name="startsOn" label="Starts" type="date" disabled={started} />
              <TextField control={form.control} name="endsOn" label="Ends" type="date" />
            </div>
            <TextField
              control={form.control}
              name="sessionAllotment"
              label="Sessions per student"
              type="number"
              inputMode="numeric"
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : semester ? "Save" : "Create semester"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
