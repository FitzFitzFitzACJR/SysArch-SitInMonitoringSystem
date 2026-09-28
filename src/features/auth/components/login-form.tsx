"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/forms/form-alert";
import { TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { loginAction } from "../actions";
import { LoginSchema, type LoginInput } from "../schemas";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { idNumber: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    applyActionResult(form, await loginAction(values, callbackUrl));
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField control={form.control} name="idNumber" label="ID number" autoComplete="username" autoFocus />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          description={
            <Link href="/forgot-password" className="underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          }
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
