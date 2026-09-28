"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Coins } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { awardAction } from "../actions";
import { AwardSchema, type AwardFormValues, type AwardInput } from "../schemas";

export function AwardDialog({
  studentId,
  studentName,
  pointsPerSession,
}: {
  studentId: string;
  studentName: string;
  pointsPerSession: number;
}) {
  const [open, setOpen] = useState(false);
  const empty: AwardFormValues = { studentId, kind: "points", amount: "", reason: "" };
  const form = useForm<AwardFormValues, unknown, AwardInput>({
    resolver: zodResolver(AwardSchema),
    defaultValues: empty,
  });
  const kind = useWatch({ control: form.control, name: "kind" });

  async function onSubmit() {
    const raw = form.getValues();
    const result = await awardAction(raw);
    if (!applyActionResult(form, result) || !result.ok) return;
    const n = Number(raw.amount);
    toast.success(
      `${n > 0 ? "Gave" : "Deducted"} ${Math.abs(n)} ${raw.kind}` +
        (result.data.bonusSessions ? ` · converted into ${result.data.bonusSessions} bonus session(s)` : ""),
    );
    form.reset(empty);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start">
          <Coins /> Award points or sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust {studentName}&apos;s balance</DialogTitle>
          <DialogDescription>
            Every {pointsPerSession} points become a bonus session automatically. Use a negative number to deduct. The
            student is notified with your reason.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <Controller
              control={form.control}
              name="kind"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList>
                    <TabsTrigger value="points">Points</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
            <TextField
              control={form.control}
              name="amount"
              label={kind === "points" ? "Points" : "Sessions"}
              type="number"
              inputMode="numeric"
              placeholder={kind === "points" ? "e.g. 2" : "e.g. 1"}
            />
            <TextField control={form.control} name="reason" label="Reason" placeholder="e.g. Helped set up Lab 524" />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
