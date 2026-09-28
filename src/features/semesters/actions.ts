"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { SemesterIdSchema, SemesterSchema, UpdateSemesterSchema } from "./schemas";
import { applySemesterReset, createSemester, deleteSemester, updateSemester } from "./service";

const access = { permission: "semester:manage" } as const;
const refresh = () => revalidatePath("/admin/semesters");

export const createSemesterAction = createAction(SemesterSchema, access, async (input, { user, ip }) => {
  await createSemester(input, { id: user.id, ip });
  refresh();
});

export const updateSemesterAction = createAction(
  UpdateSemesterSchema,
  access,
  async ({ id, ...input }, { user, ip }) => {
    await updateSemester(id, input, { id: user.id, ip });
    refresh();
  },
);

export const deleteSemesterAction = createAction(SemesterIdSchema, access, async ({ id }, { user, ip }) => {
  await deleteSemester(id, { id: user.id, ip });
  refresh();
});

/** The original's "reset all sessions", now scoped to a semester and fully ledgered. */
export const resetSemesterSessionsAction = createAction(SemesterIdSchema, access, async ({ id }, { user, ip }) => {
  const changed = await applySemesterReset(id, { id: user.id, ip });
  refresh();
  revalidatePath("/admin/students");
  return { changed };
});
