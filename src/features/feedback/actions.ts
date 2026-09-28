"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { FeedbackIdSchema, FeedbackReadSchema, FeedbackSchema } from "./schemas";
import { deleteFeedback, setFeedbackRead, submitFeedback } from "./service";

export const submitFeedbackAction = createAction(FeedbackSchema, { roles: ["STUDENT"] }, async (input, { user }) => {
  await submitFeedback(user.id, input);
  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
});

export const setFeedbackReadAction = createAction(
  FeedbackReadSchema,
  { permission: "feedback:read" },
  async ({ id, read }) => {
    await setFeedbackRead(id, read);
    revalidatePath("/admin/feedback");
  },
);

export const deleteFeedbackAction = createAction(
  FeedbackIdSchema,
  { permission: "feedback:read" },
  async ({ id }, { user, ip }) => {
    await deleteFeedback(id, { id: user.id, ip });
    revalidatePath("/admin/feedback");
  },
);
