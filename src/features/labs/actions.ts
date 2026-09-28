"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { BulkLabSchema, CreateLabSchema, ResizeLabSchema, SetComputerStateSchema, UpdateLabSchema } from "./schemas";
import { bulkLab, createLab, resizeLab, setComputerState, updateLab } from "./service";

const refresh = (labId?: string) => {
  revalidatePath("/admin/labs");
  if (labId) revalidatePath(`/admin/labs/${labId}`);
};

export const createLabAction = createAction(
  CreateLabSchema,
  { permission: "lab:manage" },
  async (input, { user, ip }) => {
    const lab = await createLab(input, { id: user.id, ip });
    refresh();
    return { id: lab.id };
  },
);

export const updateLabAction = createAction(
  UpdateLabSchema,
  { permission: "lab:manage" },
  async (input, { user, ip }) => {
    await updateLab(input, { id: user.id, ip });
    refresh(input.id);
  },
);

export const resizeLabAction = createAction(
  ResizeLabSchema,
  { permission: "lab:manage" },
  async (input, { user, ip }) => {
    await resizeLab(input.labId, input.computerCount, { id: user.id, ip });
    refresh(input.labId);
  },
);

export const setComputerStateAction = createAction(
  SetComputerStateSchema,
  { permission: "computer:manage" },
  async ({ labId, computerIds, state, note }, { user, ip }) => {
    const result = await setComputerState(labId, computerIds, state, note, { id: user.id, ip });
    refresh(labId);
    return result;
  },
);

export const bulkLabAction = createAction(
  BulkLabSchema,
  { permission: "computer:manage" },
  async ({ labId, mode }, { user, ip }) => {
    const result = await bulkLab(labId, mode, { id: user.id, ip });
    refresh(labId);
    return result;
  },
);
