"use client";

import { Mail, MailOpen, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteFeedbackAction, setFeedbackReadAction } from "../actions";

export function FeedbackRowActions({ id, read }: { id: string; read: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={read ? "Mark as unread" : "Mark as read"}
        title={read ? "Mark as unread" : "Mark as read"}
        onClick={() =>
          startTransition(async () => {
            const r = await setFeedbackReadAction({ id, read: !read });
            if (!r.ok) toast.error(r.error);
          })
        }
      >
        {read ? <Mail /> : <MailOpen />}
      </Button>
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete feedback">
            <Trash2 />
          </Button>
        }
        title="Delete this feedback?"
        description="It will be removed permanently."
        confirmLabel="Delete"
        destructive
        successMessage="Feedback deleted"
        action={() => deleteFeedbackAction({ id })}
      />
    </div>
  );
}
