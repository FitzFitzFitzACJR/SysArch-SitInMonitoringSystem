"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "../actions";
import { SettingsSchema, type SettingsFormValues, type SettingsInput } from "../schemas";

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const form = useForm<SettingsFormValues, unknown, SettingsInput>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: initial,
  });
  const { control } = form;

  // Runs after client-side validation passes. The action parses the same schema itself, so it
  // receives the raw form values ("07:00"), not the transformed ones (420).
  async function onSubmit() {
    const raw = form.getValues();
    if (applyActionResult(form, await updateSettingsAction(raw))) {
      form.reset(raw);
      toast.success("Settings saved");
    }
  }

  const num = { type: "number", inputMode: "numeric" } as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-6">
      <FormAlert message={form.formState.errors.root?.message} />

      <Section title="Sessions & points" description="How many sit-ins students get, and how they earn more.">
        <TextField control={control} name="defaultSessions" label="Default sessions per student" {...num} />
        <TextField control={control} name="sitInRewardPoints" label="Points for a completed sit-in" {...num} />
        <TextField
          control={control}
          name="pointsPerSession"
          label="Points per bonus session"
          description="Every time a student's balance reaches this many points, they get one extra session."
          {...num}
        />
      </Section>

      <Section title="Lab hours & time limits" description="Defaults for every lab; a lab can override its own hours.">
        <TextField control={control} name="labOpensAt" label="Labs open at" type="time" />
        <TextField control={control} name="labClosesAt" label="Labs close at" type="time" />
        <TextField
          control={control}
          name="maxSitInMinutes"
          label="Maximum sit-in length (minutes)"
          description="Sit-ins still running at this point, or at closing time, are ended automatically."
          {...num}
        />
        <TextField control={control} name="warnBeforeMinutes" label="Warn students this many minutes before" {...num} />
        <TextField control={control} name="timezone" label="Timezone" description="IANA name, e.g. Asia/Manila." />
      </Section>

      <Section title="Reservations" description="Booking window, reminders and the no-show policy.">
        <Controller
          control={control}
          name="requireReservationApproval"
          render={({ field }) => (
            <Field orientation="horizontal" className="sm:col-span-2">
              <FieldContent>
                <FieldLabel htmlFor="requireReservationApproval">Staff must approve reservations</FieldLabel>
                <FieldDescription>When off, conflict-free bookings are approved immediately.</FieldDescription>
              </FieldContent>
              <Switch id="requireReservationApproval" checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
        <TextField control={control} name="reservationMaxDaysAhead" label="Book up to (days ahead)" {...num} />
        <TextField control={control} name="reminderMinutesBefore" label="Reminder email (minutes before)" {...num} />
        <TextField
          control={control}
          name="noShowGraceMinutes"
          label="No-show after (minutes late)"
          description="Approved bookings are cancelled as no-shows after this grace period."
          {...num}
        />
        <TextField
          control={control}
          name="noShowPenaltyPoints"
          label="No-show penalty (points)"
          description="0 = no penalty."
          {...num}
        />
        <TextField
          control={control}
          name="noShowBlockThreshold"
          label="Block booking after N no-shows"
          description="Per semester. Leave empty to never block."
          {...num}
        />
      </Section>

      <Section title="Account security">
        <TextField control={control} name="maxLoginAttempts" label="Failed logins before lockout" {...num} />
        <TextField control={control} name="lockoutMinutes" label="Lockout length (minutes)" {...num} />
        <TextField
          control={control}
          name="sessionMaxAgeHours"
          label="Sign users out after (hours)"
          description="Absolute limit, regardless of activity."
          {...num}
        />
      </Section>

      <Section
        title="Lab rules"
        description="Students must accept these before their first sit-in, and again whenever they change."
      >
        <Controller
          control={control}
          name="rulesText"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="rulesText">Rules</FieldLabel>
              <Textarea id="rulesText" rows={8} {...field} aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </Section>

      <div className="bg-background/80 sticky bottom-0 -mx-4 flex justify-end border-t px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
          {form.formState.isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}
