"use client";

import { CheckCircle2, Wrench } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateIssueAction } from "../actions";

export function IssueActions({ id, status, pcLabel }: { id: string; status: "OPEN" | "IN_PROGRESS"; pcLabel: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [returnToService, setReturnToService] = useState(true);

  const update = (next: "IN_PROGRESS" | "RESOLVED") =>
    startTransition(async () => {
      const result = await updateIssueAction({ id, status: next, returnToService });
      if (!result.ok) return void toast.error(result.error);
      toast.success(
        next === "IN_PROGRESS"
          ? "Marked as in progress"
          : result.data.backInService
            ? `Resolved · ${pcLabel} is back in service`
            : "Resolved",
      );
      setOpen(false);
    });

  return (
    <div className="flex justify-end gap-1.5">
      {status === "OPEN" && (
        <Button size="sm" variant="outline" onClick={() => update("IN_PROGRESS")} disabled={pending}>
          <Wrench /> Working on it
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" disabled={pending}>
            <CheckCircle2 /> Resolve
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve this issue?</DialogTitle>
            <DialogDescription>The student who reported it will be thanked and told it&apos;s fixed.</DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={returnToService} onCheckedChange={(v) => setReturnToService(v === true)} />
            Put {pcLabel} back in service (if nothing else is reported on it)
          </label>
          <DialogFooter>
            <Button onClick={() => update("RESOLVED")} disabled={pending}>
              {pending ? "Saving…" : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
