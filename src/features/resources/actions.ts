"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { ResourceActiveSchema, ResourceIdSchema, ResourceSchema } from "./schemas";
import { createResource, deleteResource, setResourceActive } from "./service";

const access = { permission: "resource:manage" } as const;
const refresh = () => {
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
};

export const createResourceAction = createAction(ResourceSchema, access, async (input, { user, ip }) => {
  await createResource(input, { id: user.id, ip });
  refresh();
});

export const setResourceActiveAction = createAction(
  ResourceActiveSchema,
  access,
  async ({ id, isActive }, { user, ip }) => {
    await setResourceActive(id, isActive, { id: user.id, ip });
    refresh();
  },
);

export const deleteResourceAction = createAction(ResourceIdSchema, access, async ({ id }, { user, ip }) => {
  await deleteResource(id, { id: user.id, ip });
  refresh();
});
