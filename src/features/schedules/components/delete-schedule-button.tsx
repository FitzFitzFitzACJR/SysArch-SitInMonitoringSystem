"use client";

import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteScheduleAction } from "../actions";

export function DeleteScheduleButton({ id, label }: { id: string; label: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${label}`}>
          <Trash2 />
        </Button>
      }
      title={`Delete ${label}?`}
      description="The lab becomes bookable during this time again."
      confirmLabel="Delete"
      destructive
      successMessage="Class deleted"
      action={() => deleteScheduleAction({ id })}
    />
  );
}
