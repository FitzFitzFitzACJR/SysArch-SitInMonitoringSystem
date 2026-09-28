"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/forms/form-alert";
import { TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { changePasswordAction, forgotPasswordAction, resetPasswordAction } from "../actions";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "../schemas";

const PASSWORD_HINT = "At least 8 characters, with a letter and a number.";

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(async (v) => applyActionResult(form, await changePasswordAction(v)))} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField
          control={form.control}
          name="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
        />
        <TextField
          control={form.control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description={PASSWORD_HINT}
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Change password"}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (sent) {
    return (
      <FormAlert
        variant="success"
        message="If that email belongs to an account, a reset link is on its way. It expires in 1 hour."
      />
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        if (applyActionResult(form, await forgotPasswordAction(v))) setSent(true);
      })}
      noValidate
    >
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField control={form.control} name="email" label="Email" type="email" autoComplete="email" autoFocus />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
  });

  if (done) {
    return (
      <div className="grid gap-4">
        <FormAlert variant="success" message="Your password has been changed." />
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        if (applyActionResult(form, await resetPasswordAction(v))) setDone(true);
      })}
      noValidate
    >
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField
          control={form.control}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          description={PASSWORD_HINT}
        />
        <TextField
          control={form.control}
          name="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Set new password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
