"use client";

import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteAnnouncementAction } from "../actions";

export function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Delete ${title}`}>
          <Trash2 />
        </Button>
      }
      title="Delete this announcement?"
      description={`"${title}" will no longer be shown to students.`}
      confirmLabel="Delete"
      destructive
      successMessage="Announcement deleted"
      action={() => deleteAnnouncementAction({ id })}
    />
  );
}
