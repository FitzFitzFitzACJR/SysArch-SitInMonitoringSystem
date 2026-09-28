"use client";

import { X } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { cancelReservationAction } from "../actions";

export function CancelReservationButton({ id, label, byStaff }: { id: string; label: string; byStaff?: boolean }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="sm" aria-label={`Cancel booking: ${label}`}>
          <X /> Cancel
        </Button>
      }
      title="Cancel this booking?"
      description={byStaff ? `${label}. The student is notified.` : `${label}. Your place goes to someone else.`}
      confirmLabel="Cancel booking"
      destructive
      successMessage="Booking cancelled"
      action={() => cancelReservationAction({ id })}
    />
  );
}
