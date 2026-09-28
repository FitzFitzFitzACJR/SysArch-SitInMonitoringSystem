"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { createStudentAction, updateStudentAction } from "../actions";
import { StudentSchema, type StudentFormValues, type StudentInput } from "../schemas";

export type CourseOption = { id: string; code: string; name: string };

export const YEAR_OPTIONS = [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` }));

export function courseOptions(courses: CourseOption[]) {
  return courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }));
}

/** Staff form for adding a student or editing one (pass `student` to edit). */
export function StudentForm({
  courses,
  student,
  onSaved,
}: {
  courses: CourseOption[];
  student?: StudentFormValues & { id: string };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const form = useForm<StudentFormValues, unknown, StudentInput>({
    resolver: zodResolver(StudentSchema),
    defaultValues: student ?? {
      idNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      courseId: "",
      yearLevel: "",
    },
  });

  // Runs after client-side validation. Send the raw form values: the action parses them with
  // the same schema, and Zod transforms aren't meant to be applied twice.
  async function onSubmit() {
    const values = form.getValues();
    if (student) {
      if (applyActionResult(form, await updateStudentAction({ ...values, id: student.id }))) {
        form.reset(form.getValues());
        toast.success("Student updated");
        onSaved?.();
      }
      return;
    }
    const result = await createStudentAction(values);
    if (applyActionResult(form, result) && result.ok) {
      toast.success("Student added. A link to set their password was emailed to them.");
      onSaved?.();
      router.push(`/admin/students/${result.data.id}`);
    }
  }

  const { control } = form;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <TextField control={control} name="idNumber" label="ID number" autoComplete="off" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name="firstName" label="First name" autoComplete="off" />
          <TextField control={control} name="lastName" label="Last name" autoComplete="off" />
        </div>
        <TextField control={control} name="middleName" label="Middle name (optional)" autoComplete="off" />
        <TextField control={control} name="email" label="Email" type="email" autoComplete="off" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField control={control} name="courseId" label="Course" options={courseOptions(courses)} />
          <SelectField control={control} name="yearLevel" label="Year level" options={YEAR_OPTIONS} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting || (!!student && !form.formState.isDirty)}>
            {form.formState.isSubmitting ? "Saving…" : student ? "Save changes" : "Add student"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
