"use client";

import { Check, X } from "lucide-react";
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
import { decideReservationAction } from "../actions";

export function DecideButtons({ id, studentName }: { id: string; studentName: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  const decide = (approve: boolean) =>
    startTransition(async () => {
      const result = await decideReservationAction({ id, approve, note: approve ? undefined : note });
      if (!result.ok) {
        if (approve) toast.error(result.error);
        else setError(result.fieldErrors?.note?.[0] ?? result.error);
        return;
      }
      toast.success(approve ? `Approved ${studentName}'s booking` : `Declined ${studentName}'s booking`);
      setOpen(false);
    });

  return (
    <div className="flex justify-end gap-1.5">
      <Button size="sm" onClick={() => decide(true)} disabled={pending}>
        <Check /> Approve
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            <X /> Decline
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this booking?</DialogTitle>
            <DialogDescription>{studentName} will see your reason.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`note-${id}`}>Reason</Label>
            <Input
              id={`note-${id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Lab reserved for an exam that day"
              aria-invalid={!!error}
            />
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => decide(false)} disabled={pending}>
              {pending ? "Declining…" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
