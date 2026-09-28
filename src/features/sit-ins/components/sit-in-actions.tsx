"use client";

import { Award, Square, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelSitInAction, endSitInAction } from "../actions";

/** End with reward / end without / cancel & refund. */
export function SitInActions({
  sitInId,
  studentName,
  rewardPoints,
  compact,
  onDone,
}: {
  sitInId: string;
  studentName: string;
  rewardPoints: number;
  compact?: boolean;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function end(reward: boolean) {
    startTransition(async () => {
      const result = await endSitInAction({ id: sitInId, reward });
      if (!result.ok) return void toast.error(result.error);
      toast.success(
        `Ended ${studentName}'s sit-in` +
          (reward ? ` · +${rewardPoints} point${rewardPoints === 1 ? "" : "s"}` : "") +
          (result.data.bonusSessions ? ` · earned a bonus session!` : ""),
      );
      onDone?.();
    });
  }

  // Accessible names start with the visible text (WCAG 2.5.3) and add whose sit-in it is.
  const rewardLabel = compact ? "End +pt" : `End & reward (+${rewardPoints})`;
  const plainLabel = compact ? "End" : "End without reward";

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {rewardPoints > 0 && (
        <Button size="sm" onClick={() => end(true)} disabled={pending} aria-label={`${rewardLabel}, ${studentName}`}>
          <Award /> {rewardLabel}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => end(false)}
        disabled={pending}
        aria-label={`${plainLabel}, ${studentName}`}
      >
        <Square /> {plainLabel}
      </Button>
      <CancelSitInDialog sitInId={sitInId} studentName={studentName} onDone={onDone} />
    </div>
  );
}

function CancelSitInDialog({
  sitInId,
  studentName,
  onDone,
}: {
  sitInId: string;
  studentName: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          title="Cancel and refund the session"
          aria-label={`Cancel ${studentName}'s sit-in`}
        >
          <Undo2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this sit-in?</DialogTitle>
          <DialogDescription>
            For sit-ins started by mistake. {studentName} gets the session back, and no points are awarded.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={`reason-${sitInId}`}>Reason</Label>
          <Input
            id={`reason-${sitInId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. wrong student scanned"
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelSitInAction({ id: sitInId, reason });
                if (!result.ok) return setError(result.fieldErrors?.reason?.[0] ?? result.error);
                toast.success("Sit-in cancelled and session refunded");
                setOpen(false);
                onDone?.();
              })
            }
          >
            {pending ? "Cancelling…" : "Cancel & refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
