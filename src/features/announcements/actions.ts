"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { AnnouncementIdSchema, AnnouncementSchema, UpdateAnnouncementSchema } from "./schemas";
import { archiveAnnouncement, createAnnouncement, updateAnnouncement } from "./service";

const access = { permission: "announcement:manage" } as const;
const refresh = () => {
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/announcements");
};

export const createAnnouncementAction = createAction(AnnouncementSchema, access, async (input, { user, ip }) => {
  await createAnnouncement(input, { id: user.id, ip });
  refresh();
});

export const updateAnnouncementAction = createAction(
  UpdateAnnouncementSchema,
  access,
  async ({ id, ...input }, { user, ip }) => {
    await updateAnnouncement(id, input, { id: user.id, ip });
    refresh();
  },
);

export const deleteAnnouncementAction = createAction(AnnouncementIdSchema, access, async ({ id }, { user, ip }) => {
  await archiveAnnouncement(id, { id: user.id, ip });
  refresh();
});
