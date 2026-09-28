"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteResourceAction, setResourceActiveAction } from "../actions";

export function ResourceRowActions({ id, title, isActive }: { id: string; title: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={isActive ? `Hide ${title} from students` : `Show ${title} to students`}
        title={isActive ? "Hide from students" : "Show to students"}
        onClick={() =>
          startTransition(async () => {
            const r = await setResourceActiveAction({ id, isActive: !isActive });
            if (!r.ok) toast.error(r.error);
          })
        }
      >
        {isActive ? <EyeOff /> : <Eye />}
      </Button>
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Delete ${title}`}>
            <Trash2 />
          </Button>
        }
        title="Delete this resource?"
        description={`"${title}" and any uploaded file will be removed.`}
        confirmLabel="Delete"
        destructive
        successMessage="Resource deleted"
        action={() => deleteResourceAction({ id })}
      />
    </div>
  );
}
