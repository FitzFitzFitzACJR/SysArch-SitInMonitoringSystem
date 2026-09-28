"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { ScheduleIdSchema, ScheduleSchema, UpdateScheduleSchema } from "./schemas";
import { createSchedule, deleteSchedule, updateSchedule } from "./service";

const access = { permission: "schedule:manage" } as const;
const refresh = () => {
  revalidatePath("/admin/schedules");
  revalidatePath("/reservations");
};

export const createScheduleAction = createAction(ScheduleSchema, access, async (input, { user, ip }) => {
  const { conflictingBookings } = await createSchedule(input, { id: user.id, ip });
  refresh();
  return { conflictingBookings };
});

export const updateScheduleAction = createAction(
  UpdateScheduleSchema,
  access,
  async ({ id, ...input }, { user, ip }) => {
    const result = await updateSchedule(id, input, { id: user.id, ip });
    refresh();
    return result;
  },
);

export const deleteScheduleAction = createAction(ScheduleIdSchema, access, async ({ id }, { user, ip }) => {
  await deleteSchedule(id, { id: user.id, ip });
  refresh();
});
