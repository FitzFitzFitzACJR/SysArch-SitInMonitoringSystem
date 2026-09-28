"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { createLabAction, updateLabAction } from "../actions";
import { CreateLabSchema, type CreateLabInput, type LabFormValues } from "../schemas";

type EditableLab = {
  id: string;
  code: string;
  name: string;
  gridColumns: number;
  opensAt: string; // "HH:MM" or ""
  closesAt: string;
  isActive: boolean;
};

/** Create a lab (with its PCs) or edit an existing one's details. */
export function LabFormDialog({ lab, defaultHours }: { lab?: EditableLab; defaultHours: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const editing = Boolean(lab);

  // One client-side schema for both modes: when editing, computerCount is a placeholder the
  // server ignores (UpdateLabSchema strips it; resizing is a separate action).
  const form = useForm<LabFormValues, unknown, CreateLabInput>({
    resolver: zodResolver(CreateLabSchema),
    defaultValues: lab
      ? { ...lab, computerCount: 1 }
      : { code: "", name: "", gridColumns: 10, opensAt: "", closesAt: "", isActive: true, computerCount: 40 },
  });

  async function onSubmit() {
    const values = form.getValues();
    if (lab) {
      if (applyActionResult(form, await updateLabAction({ ...values, id: lab.id }))) {
        toast.success("Lab updated");
        setOpen(false);
      }
      return;
    }
    const result = await createLabAction(values);
    if (applyActionResult(form, result) && result.ok) {
      toast.success("Lab created");
      setOpen(false);
      router.push(`/admin/labs/${result.data.id}`);
    }
  }

  const { control } = form;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="outline">
            <Pencil /> Edit lab
          </Button>
        ) : (
          <Button>
            <Plus /> Add lab
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit lab" : "Add a lab"}</DialogTitle>
          <DialogDescription>Leave the hours empty to use the default ({defaultHours}).</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <div className="grid grid-cols-[7rem_1fr] gap-4">
              <TextField control={control} name="code" label="Code" placeholder="524" />
              <TextField control={control} name="name" label="Name" placeholder="Lab 524" />
            </div>
            {!editing && (
              <TextField
                control={control}
                name="computerCount"
                label="Number of computers"
                type="number"
                inputMode="numeric"
                description="Numbered 1, 2, 3… You can add or remove PCs later."
              />
            )}
            <TextField
              control={control}
              name="gridColumns"
              label="Computers per row"
              type="number"
              inputMode="numeric"
              description="How the lab map is laid out, to match the real room."
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField control={control} name="opensAt" label="Opens at" type="time" />
              <TextField control={control} name="closesAt" label="Closes at" type="time" />
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="lab-active">Open for sit-ins and reservations</FieldLabel>
                    <FieldDescription>Turn off for a lab that&apos;s closed for the semester.</FieldDescription>
                  </FieldContent>
                  <Switch id="lab-active" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : editing ? "Save lab" : "Create lab"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
