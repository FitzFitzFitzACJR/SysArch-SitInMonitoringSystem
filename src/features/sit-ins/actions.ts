"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/action";
import { CancelSitInSchema, EndSitInSchema, LabIdSchema, LookupSchema, StartSitInSchema } from "./schemas";
import { availableComputers, cancelSitIn, endSitIn, lookupStudent, rotateQrToken, startSitIn } from "./service";

const refresh = () => {
  revalidatePath("/admin/sit-ins");
  revalidatePath("/admin/labs", "layout");
};

const staff = { permission: "sitIn:manage" } as const;

export const lookupStudentAction = createAction(LookupSchema, staff, ({ query }) => lookupStudent(query));

export const availableComputersAction = createAction(LabIdSchema, staff, ({ labId }) => availableComputers(labId));

export const startSitInAction = createAction(StartSitInSchema, staff, async (input, { user, ip }) => {
  await startSitIn(input, { id: user.id, ip });
  refresh();
});

export const endSitInAction = createAction(EndSitInSchema, staff, async ({ id, reward }, { user, ip }) => {
  const result = await endSitIn(id, reward, { id: user.id, ip });
  refresh();
  return result;
});

export const cancelSitInAction = createAction(CancelSitInSchema, staff, async ({ id, reason }, { user, ip }) => {
  await cancelSitIn(id, reason, { id: user.id, ip });
  refresh();
});

export const rotateQrAction = createAction(z.object({}), { roles: ["STUDENT"] }, async (_input, { user }) => {
  await rotateQrToken(user.id);
  revalidatePath("/profile");
});
