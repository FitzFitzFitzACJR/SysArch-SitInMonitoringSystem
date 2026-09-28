"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { StaffIdSchema, StaffRoleSchema, StaffSchema, StaffStatusSchema } from "./schemas";
import { createStaff, resendStaffInvite, setStaffRole, setStaffStatus } from "./service";

const access = { permission: "staff:manage" } as const;

export const createStaffAction = createAction(StaffSchema, access, async (input, { user, ip }) => {
  await createStaff(input, { id: user.id, ip });
  revalidatePath("/admin/staff");
});

export const setStaffRoleAction = createAction(StaffRoleSchema, access, async ({ id, role }, { user, ip }) => {
  await setStaffRole(id, role, { id: user.id, ip });
  revalidatePath("/admin/staff");
});

export const setStaffStatusAction = createAction(StaffStatusSchema, access, async ({ id, status }, { user, ip }) => {
  await setStaffStatus(id, status, { id: user.id, ip });
  revalidatePath("/admin/staff");
});

export const resendStaffInviteAction = createAction(StaffIdSchema, access, ({ id }) => resendStaffInvite(id));
