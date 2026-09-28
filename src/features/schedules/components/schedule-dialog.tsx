"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { FieldGroup } from "@/components/ui/field";
import { createScheduleAction, updateScheduleAction } from "../actions";
import { DAYS, ScheduleSchema, type ScheduleFormValues, type ScheduleInput } from "../schemas";

const DAY_OPTIONS = DAYS.map((d, i) => ({ value: String(i), label: d }));

export function ScheduleDialog({
  labs,
  schedule,
  defaultLabId,
}: {
  labs: { id: string; name: string }[];
  schedule?: ScheduleFormValues & { id: string };
  defaultLabId?: string;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<ScheduleFormValues, unknown, ScheduleInput>({
    resolver: zodResolver(ScheduleSchema),
    defaultValues: schedule ?? {
      labId: defaultLabId ?? "",
      dayOfWeek: "1",
      startMinute: "08:00",
      endMinute: "09:30",
      courseCode: "",
      instructor: "",
    },
  });

  async function onSubmit() {
    const raw = form.getValues();
    const result = schedule ? await updateScheduleAction({ ...raw, id: schedule.id }) : await createScheduleAction(raw);
    if (!applyActionResult(form, result) || !result.ok) return;
    toast.success(schedule ? "Class updated" : "Class added");
    const conflicts = result.data?.conflictingBookings ?? 0;
    if (conflicts) {
      toast.warning(
        `${conflicts} upcoming booking${conflicts === 1 ? "" : "s"} now overlap this class. Review them under Reservations.`,
      );
    }
    if (!schedule) form.reset({ ...raw, courseCode: "", instructor: "" });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {schedule ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${schedule.courseCode}`}>
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus /> Add class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edit class" : "Add a class"}</DialogTitle>
          <DialogDescription>The lab can&apos;t be reserved during scheduled classes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <SelectField
              control={form.control}
              name="labId"
              label="Lab"
              options={labs.map((l) => ({ value: l.id, label: l.name }))}
            />
            <SelectField control={form.control} name="dayOfWeek" label="Day" options={DAY_OPTIONS} />
            <div className="grid grid-cols-2 gap-4">
              <TextField control={form.control} name="startMinute" label="Starts" type="time" />
              <TextField control={form.control} name="endMinute" label="Ends" type="time" />
            </div>
            <TextField control={form.control} name="courseCode" label="Course code" placeholder="IT 221" />
            <TextField control={form.control} name="instructor" label="Instructor" />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : schedule ? "Save class" : "Add class"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
