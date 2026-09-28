"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/action";
import { DomainError } from "@/lib/errors";
import { sendPasswordLink } from "@/features/auth/service";
import { db } from "@/lib/db";
import { ImportFileError, parseSpreadsheet, type ImportRowResult } from "./import";
import { ProfileSchema, StudentIdSchema, StudentSchema, UpdateStudentSchema } from "./schemas";
import {
  buildImportPreview,
  createStudent,
  deleteStudent,
  importStudents,
  removePhoto,
  resetStudentSessions,
  setPhoto,
  setStudentStatus,
  updateOwnProfile,
  updateStudent,
} from "./service";

const refresh = (id?: string) => {
  revalidatePath("/admin/students");
  if (id) revalidatePath(`/admin/students/${id}`);
};

// --- Staff ---------------------------------------------------------------------

export const createStudentAction = createAction(
  StudentSchema,
  { permission: "student:edit" },
  async (input, { user, ip }) => {
    const student = await createStudent(input, { id: user.id, ip });
    refresh();
    return { id: student.id };
  },
);

export const updateStudentAction = createAction(
  UpdateStudentSchema,
  { permission: "student:edit" },
  async (input, { user, ip }) => {
    await updateStudent(input, { id: user.id, ip });
    refresh(input.id);
  },
);

export const resetStudentSessionsAction = createAction(
  StudentIdSchema,
  { permission: "student:edit" },
  async ({ id }, { user, ip }) => {
    const sessions = await resetStudentSessions(id, { id: user.id, ip });
    refresh(id);
    return { sessions };
  },
);

export const setStudentStatusAction = createAction(
  StudentIdSchema.extend({ status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]) }),
  { permission: "student:edit" },
  async ({ id, status }, { user, ip }) => {
    // Lab staff may deactivate/reactivate; archiving is a super-admin decision.
    if (status === "ARCHIVED" && user.role !== "SUPER_ADMIN")
      throw new DomainError("Only a super admin can archive students.");
    await setStudentStatus(id, status, { id: user.id, ip });
    refresh(id);
  },
);

export const deleteStudentAction = createAction(
  StudentIdSchema,
  { permission: "student:delete" },
  async ({ id }, { user, ip }) => {
    await deleteStudent(id, { id: user.id, ip });
    refresh();
  },
);

export const resendInviteAction = createAction(StudentIdSchema, { permission: "student:edit" }, async ({ id }) => {
  const student = await db.user.findFirst({ where: { id, role: "STUDENT", status: "ACTIVE" } });
  if (!student) throw new DomainError("Student not found or not active.");
  await sendPasswordLink(student, "invite");
});

const PhotoForm = z.object({ id: z.string().min(1), photo: z.instanceof(File, { message: "Choose a photo" }) });

export const setStudentPhotoAction = createAction(
  PhotoForm,
  { permission: "student:edit" },
  async ({ id, photo }, { user, ip }) => {
    const url = await setPhoto(id, photo, { id: user.id, ip });
    refresh(id);
    return { url };
  },
);

// --- Bulk import ----------------------------------------------------------------

const ImportFileForm = z.object({ file: z.instanceof(File, { message: "Choose a file" }) });

async function readRows(file: File) {
  try {
    return await parseSpreadsheet(file);
  } catch (e) {
    if (e instanceof ImportFileError) throw new DomainError(e.message);
    throw e;
  }
}

export const previewImportAction = createAction(
  ImportFileForm,
  { permission: "student:import" },
  async ({ file }): Promise<{ rows: ImportRowResult[] }> => ({ rows: await buildImportPreview(await readRows(file)) }),
);

export const commitImportAction = createAction(
  ImportFileForm.extend({ sendInvites: z.boolean() }),
  { permission: "student:import" },
  async ({ file, sendInvites }, { user, ip }) => {
    const result = await importStudents(await readRows(file), sendInvites, { id: user.id, ip });
    refresh();
    return { imported: result.imported, skipped: result.skipped.length };
  },
);

// --- Student self-service -----------------------------------------------------------

export const updateProfileAction = createAction(ProfileSchema, { roles: ["STUDENT"] }, async (input, { user }) => {
  await updateOwnProfile(user.id, input);
  revalidatePath("/profile");
});

export const setOwnPhotoAction = createAction(
  z.object({ photo: z.instanceof(File, { message: "Choose a photo" }) }),
  { signedIn: true },
  async ({ photo }, { user }) => {
    const url = await setPhoto(user.id, photo);
    revalidatePath("/", "layout");
    return { url };
  },
);

export const removeOwnPhotoAction = createAction(z.object({}), { signedIn: true }, async (_input, { user }) => {
  await removePhoto(user.id);
  revalidatePath("/", "layout");
});
