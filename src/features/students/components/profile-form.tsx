"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { SelectField, TextField, applyActionResult } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { removeOwnPhotoAction, setOwnPhotoAction, updateProfileAction } from "../actions";
import { ProfileSchema, type ProfileFormValues, type ProfileInput } from "../schemas";
import { PhotoUploader } from "./photo-uploader";
import { YEAR_OPTIONS, courseOptions, type CourseOption } from "./student-form";

export function OwnPhoto(props: { firstName: string; lastName: string; photoUrl: string | null }) {
  return (
    <PhotoUploader
      {...props}
      upload={(photo) => setOwnPhotoAction({ photo })}
      remove={() => removeOwnPhotoAction({})}
    />
  );
}

export function ProfileForm({ courses, initial }: { courses: CourseOption[]; initial: ProfileFormValues }) {
  const form = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: initial,
  });

  // Send raw form values; the action re-parses them with the same schema.
  async function onSubmit() {
    if (applyActionResult(form, await updateProfileAction(form.getValues()))) {
      form.reset(form.getValues());
      toast.success("Profile saved");
    }
  }

  const { control } = form;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <FormAlert message={form.formState.errors.root?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={control} name="firstName" label="First name" autoComplete="given-name" />
          <TextField control={control} name="lastName" label="Last name" autoComplete="family-name" />
        </div>
        <TextField control={control} name="middleName" label="Middle name (optional)" autoComplete="additional-name" />
        <TextField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField control={control} name="courseId" label="Course" options={courseOptions(courses)} />
          <SelectField control={control} name="yearLevel" label="Year level" options={YEAR_OPTIONS} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            {form.formState.isSubmitting ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
