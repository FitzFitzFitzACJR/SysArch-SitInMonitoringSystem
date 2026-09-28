"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { AwardSchema } from "./schemas";
import { award } from "./service";

export const awardAction = createAction(AwardSchema, { permission: "points:award" }, async (input, { user, ip }) => {
  const result = await award(input, { id: user.id, ip });
  revalidatePath(`/admin/students/${input.studentId}`);
  return result;
});
