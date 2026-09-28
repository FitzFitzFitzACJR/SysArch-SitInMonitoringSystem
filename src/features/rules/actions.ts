"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAction } from "@/lib/action";
import { DomainError } from "@/lib/errors";
import { db } from "@/lib/db";
import { getSettings } from "@/features/settings/queries";

/**
 * The student accepts the version they were shown. If the rules changed in the meantime,
 * the version won't match and they're asked to read the new ones.
 */
export const acceptRulesAction = createAction(
  z.object({ version: z.number().int().min(1) }),
  { roles: ["STUDENT"] },
  async ({ version }, { user }) => {
    const settings = await getSettings();
    if (version !== settings.rulesVersion)
      throw new DomainError("The rules were just updated. Please read them again.");
    await db.user.update({ where: { id: user.id }, data: { rulesAcceptedVer: version } });
    revalidatePath("/dashboard");
  },
);
