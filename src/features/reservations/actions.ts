"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action";
import { can } from "@/lib/permissions";
import { AvailabilitySchema, DecideSchema, ReservationIdSchema, ReservationSchema } from "./schemas";
import { cancelReservation, createReservation, decideReservation, getDayAvailability } from "./service";

const refresh = () => {
  revalidatePath("/reservations");
  revalidatePath("/admin/reservations");
};

/** Slot availability for the booking screen (students) and the staff calendar. */
export const availabilityAction = createAction(AvailabilitySchema, { signedIn: true }, async ({ labId, date }) => {
  const day = await getDayAvailability(labId, date);
  return { slots: day.slots, computers: day.computers, hasSemester: Boolean(day.semester) };
});

export const createReservationAction = createAction(
  ReservationSchema,
  { roles: ["STUDENT"] },
  async (input, { user }) => {
    const reservation = await createReservation(user.id, input);
    refresh();
    return { status: reservation.status };
  },
);

export const cancelReservationAction = createAction(
  ReservationIdSchema,
  { signedIn: true },
  async ({ id }, { user, ip }) => {
    // Students may only cancel their own (checked in the service); staff with the permission any.
    await cancelReservation(id, { id: user.id, ip, isStaff: can(user.role, "reservation:decide") });
    refresh();
  },
);

export const decideReservationAction = createAction(
  DecideSchema,
  { permission: "reservation:decide" },
  async ({ id, approve, note }, { user, ip }) => {
    await decideReservation(id, approve, note, { id: user.id, ip });
    refresh();
  },
);
