"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStaffAction, resendStaffInviteAction, setStaffRoleAction, setStaffStatusAction } from "../actions";
import { STAFF_ROLES, STAFF_ROLE_LABELS, StaffSchema, type StaffInput } from "../schemas";

const ROLE_OPTIONS = STAFF_ROLES.map((r) => ({ value: r, label: STAFF_ROLE_LABELS[r] }));

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<StaffInput>({
    resolver: zodResolver(StaffSchema),
    defaultValues: { idNumber: "", firstName: "", lastName: "", email: "", role: "LAB_STAFF" },
  });

  async function onSubmit(values: StaffInput) {
    if (applyActionResult(form, await createStaffAction(values))) {
      toast.success("Staff account created. They were emailed a link to set their password.");
      form.reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a staff account</DialogTitle>
          <DialogDescription>They&apos;ll get an email with a link to set their password.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FormAlert message={form.formState.errors.root?.message} />
            <TextField control={form.control} name="idNumber" label="ID number" autoComplete="off" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="firstName" label="First name" autoComplete="off" />
              <TextField control={form.control} name="lastName" label="Last name" autoComplete="off" />
            </div>
            <TextField control={form.control} name="email" label="Email" type="email" autoComplete="off" />
            <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Row = { id: string; name: string; role: "LAB_STAFF" | "SUPER_ADMIN"; status: string; passwordPending: boolean };

export function StaffRoleSelect({ row, isSelf }: { row: Row; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={row.role}
      disabled={isSelf || pending || row.status !== "ACTIVE"}
      onValueChange={(role) =>
        startTransition(async () => {
          const result = await setStaffRoleAction({ id: row.id, role: role as Row["role"] });
          if (result.ok) toast.success(`${row.name} is now ${STAFF_ROLE_LABELS[role as Row["role"]].toLowerCase()}`);
          else toast.error(result.error);
        })
      }
    >
      <SelectTrigger aria-label={`Role for ${row.name}`} className="w-36" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StaffRowActions({ row, isSelf }: { row: Row; isSelf: boolean }) {
  if (isSelf) return <span className="text-muted-foreground text-xs">You</span>;
  const active = row.status === "ACTIVE";
  return (
    <div className="flex justify-end gap-1">
      {row.passwordPending && active && (
        <ConfirmAction
          trigger={
            <Button variant="ghost" size="sm" aria-label={`Resend invite to ${row.name}`}>
              <Mail />
            </Button>
          }
          title="Resend the set-password email?"
          description="Any earlier link stops working."
          confirmLabel="Send"
          successMessage="Email sent"
          action={() => resendStaffInviteAction({ id: row.id })}
        />
      )}
      <ConfirmAction
        trigger={
          <Button variant="outline" size="sm">
            {active ? "Deactivate" : "Reactivate"}
          </Button>
        }
        title={`${active ? "Deactivate" : "Reactivate"} ${row.name}?`}
        description={
          active ? "They'll be signed out immediately and can't sign in." : "They'll be able to sign in again."
        }
        confirmLabel={active ? "Deactivate" : "Reactivate"}
        destructive={active}
        successMessage={active ? "Account deactivated" : "Account reactivated"}
        action={() => setStaffStatusAction({ id: row.id, status: active ? "INACTIVE" : "ACTIVE" })}
      />
    </div>
  );
}
