"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { ReportIssueSchema, UpdateIssueSchema } from "./schemas";
import { reportIssue, updateIssueStatus } from "./service";

export const reportIssueAction = createAction(ReportIssueSchema, { roles: ["STUDENT"] }, async (input, { user }) => {
  await reportIssue(user.id, input);
  revalidatePath("/dashboard");
});

export const updateIssueAction = createAction(
  UpdateIssueSchema,
  { permission: "issue:resolve" },
  async ({ id, status, returnToService }, { user, ip }) => {
    const result = await updateIssueStatus(id, status, returnToService, { id: user.id, ip });
    revalidatePath("/admin/issues");
    return result;
  },
);
