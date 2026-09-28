"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { registerAction } from "../actions";
import { RegisterSchema, type RegisterInput } from "../schemas";

const YEAR_LEVELS = [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` }));

export function RegisterForm({ courses }: { courses: { id: string; code: string; name: string }[] }) {
  const form = useForm<z.input<typeof RegisterSchema>, unknown, RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      idNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      courseId: "",
      yearLevel: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Send raw form values; the action re-parses them with the same schema.
  async function onSubmit() {
    applyActionResult(form, await registerAction(form.getValues()));
  }

  const courseOptions = courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField control={form.control} name="idNumber" label="ID number" autoComplete="username" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="firstName" label="First name" autoComplete="given-name" />
          <TextField control={form.control} name="lastName" label="Last name" autoComplete="family-name" />
        </div>
        <TextField
          control={form.control}
          name="middleName"
          label="Middle name (optional)"
          autoComplete="additional-name"
        />
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField control={form.control} name="courseId" label="Course" options={courseOptions} />
          <SelectField control={form.control} name="yearLevel" label="Year level" options={YEAR_LEVELS} />
        </div>
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters, with a letter and a number."
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
