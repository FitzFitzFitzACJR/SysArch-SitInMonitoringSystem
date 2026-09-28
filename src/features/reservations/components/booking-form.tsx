"use client";

import { CalendarPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { availabilityAction, createReservationAction } from "../actions";
import type { SlotStatus } from "../rules";

type Option = { id: string; name: string };
type Day = {
  slots: { id: string; label: string; status: SlotStatus; takenComputerIds: string[] }[];
  computers: { id: string; number: number }[];
  hasSemester: boolean;
};

const STATUS_TEXT = (s: SlotStatus) =>
  s.kind === "open"
    ? `${s.free} place${s.free === 1 ? "" : "s"} left`
    : s.kind === "full"
      ? "Fully booked"
      : s.kind === "class"
        ? `Class: ${s.courseCode}`
        : s.kind === "past"
          ? "Already started"
          : "Lab closed";

export function BookingForm({
  labs,
  languages,
  minDate,
  maxDate,
  requiresApproval,
}: {
  labs: Option[];
  languages: Option[];
  minDate: string; // YYYY-MM-DD, today in the lab's timezone
  maxDate: string;
  requiresApproval: boolean;
}) {
  const [date, setDate] = useState(minDate);
  const [labId, setLabId] = useState(labs[0]?.id ?? "");
  const [day, setDay] = useState<Day | null>(null);
  const [slotId, setSlotId] = useState("");
  const [computerId, setComputerId] = useState(""); // "" = any free PC
  const [languageId, setLanguageId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string>();
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();

  // Load the day's slots whenever the lab or date changes.
  useEffect(() => {
    if (!labId || !date) return;
    let cancelled = false;
    startLoading(async () => {
      const result = await availabilityAction({ labId, date });
      if (cancelled) return;
      setDay(result.ok ? result.data : null);
      setSlotId("");
      setComputerId("");
      if (!result.ok) setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [labId, date]);

  const slot = day?.slots.find((s) => s.id === slotId);
  const freePcs = day && slot ? day.computers.filter((c) => !slot.takenComputerIds.includes(c.id)) : [];

  function submit() {
    setError(undefined);
    startSaving(async () => {
      const result = await createReservationAction({
        date,
        labId,
        timeSlotId: slotId,
        computerId,
        languageId,
        purpose,
      });
      if (!result.ok) {
        setError(result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] : result.error);
        // The slot may have just filled up: refresh it.
        const fresh = await availabilityAction({ labId, date });
        if (fresh.ok) setDay(fresh.data);
        return;
      }
      toast.success(
        result.data.status === "APPROVED"
          ? "Booked! See you at the lab."
          : "Request sent. You'll be notified when it's reviewed.",
      );
      setSlotId("");
      setComputerId("");
      setPurpose("");
      const fresh = await availabilityAction({ labId, date });
      if (fresh.ok) setDay(fresh.data);
    });
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="booking-date">Date</Label>
          <Input
            id="booking-date"
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="booking-lab">Lab</Label>
          <Select value={labId} onValueChange={setLabId}>
            <SelectTrigger id="booking-lab" className="w-full">
              <SelectValue placeholder="Select a lab" />
            </SelectTrigger>
            <SelectContent>
              {labs.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="grid gap-2" aria-busy={loading}>
        <legend className="mb-2 text-sm font-medium">Time slot</legend>
        {day && !day.hasSemester && (
          <p className="text-muted-foreground text-sm">Bookings aren&apos;t open for that date (no semester).</p>
        )}
        <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", loading && "opacity-60")}>
          {day?.slots.map((s) => {
            const open = s.status.kind === "open";
            return (
              <button
                key={s.id}
                type="button"
                disabled={!open}
                aria-pressed={slotId === s.id}
                aria-label={`${s.label}: ${STATUS_TEXT(s.status)}`}
                onClick={() => {
                  setSlotId(s.id);
                  setComputerId("");
                }}
                className={cn(
                  "rounded-md border p-3 text-left text-sm transition",
                  open ? "hover:bg-muted" : "cursor-not-allowed opacity-50",
                  slotId === s.id && "border-primary ring-primary ring-2",
                )}
              >
                <div className="font-medium">{s.label}</div>
                <div
                  className={cn("text-xs", open ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}
                >
                  {STATUS_TEXT(s.status)}
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {slot && (
        <>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Computer (optional)</legend>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
              <button
                type="button"
                aria-pressed={computerId === ""}
                onClick={() => setComputerId("")}
                className={cn(
                  "col-span-2 rounded-md border px-2 py-1.5 text-xs",
                  computerId === "" && "border-primary ring-primary ring-2",
                )}
              >
                Any free PC
              </button>
              {freePcs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={computerId === c.id}
                  aria-label={`PC ${c.number}`}
                  onClick={() => setComputerId(c.id)}
                  className={cn(
                    "rounded-md border px-1 py-1.5 text-xs tabular-nums",
                    computerId === c.id && "border-primary ring-primary ring-2",
                  )}
                >
                  {c.number}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <div className="grid gap-1.5">
              <Label htmlFor="booking-language">Language</Label>
              <Select value={languageId} onValueChange={setLanguageId}>
                <SelectTrigger id="booking-language" className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="booking-purpose">What will you work on?</Label>
              <Input
                id="booking-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                maxLength={200}
                placeholder="e.g. Capstone project"
              />
            </div>
          </div>
        </>
      )}

      <FormAlert message={error} />
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {requiresApproval ? "Requests are reviewed by the lab staff." : "Bookings are confirmed immediately."}{" "}
          Bookings don&apos;t use a session until you check in.
        </p>
        <Button onClick={submit} disabled={saving || !slot || !languageId || purpose.trim().length < 3}>
          <CalendarPlus /> {saving ? "Booking…" : requiresApproval ? "Request booking" : "Book"}
        </Button>
      </div>
    </div>
  );
}
