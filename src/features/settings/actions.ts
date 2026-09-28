"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { SettingsSchema } from "./schemas";
import { updateSettings } from "./service";

export const updateSettingsAction = createAction(
  SettingsSchema,
  { permission: "settings:manage" },
  async (input, { user, ip }) => {
    await updateSettings(input, { id: user.id, ip });
    revalidatePath("/", "layout");
  },
);
