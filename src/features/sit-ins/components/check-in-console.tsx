"use client";

import { LogIn, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/user-avatar";
import { availableComputersAction, lookupStudentAction, startSitInAction } from "../actions";
import type { LookupResult } from "../service";
import { Countdown } from "./countdown";
import { QrScannerDialog } from "./qr-scanner-dialog";
import { SitInActions } from "./sit-in-actions";

type Option = { id: string; name: string };

/**
 * The staff front desk: scan (camera or USB scanner) or type an ID → see the student →
 * start or end their sit-in. After each action it clears and refocuses, ready for the next.
 */
export function CheckInConsole({
  labs,
  languages,
  rewardPoints,
  warnBeforeMinutes,
}: {
  labs: Option[];
  languages: Option[];
  rewardPoints: number;
  warnBeforeMinutes: number;
}) {
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStudent(null);
    setQuery("");
    setError(undefined);
    input.current?.focus();
  }, []);

  const lookup = useCallback((value: string) => {
    setError(undefined);
    startTransition(async () => {
      const result = await lookupStudentAction({ query: value });
      if (result.ok) {
        setStudent(result.data);
        setQuery("");
      } else {
        setStudent(null);
        setError(result.error);
      }
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="size-5" /> Check in / out
        </CardTitle>
        <CardDescription>Scan a student&apos;s QR code, or type their ID number and press Enter.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) lookup(query.trim());
          }}
        >
          <Label htmlFor="lookup" className="sr-only">
            QR code or ID number
          </Label>
          <Input
            id="lookup"
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="QR code or ID number"
            autoComplete="off"
            autoFocus
            className="sm:max-w-xs"
          />
          <Button type="submit" disabled={pending || !query.trim()}>
            {pending ? "Looking up…" : "Look up"}
          </Button>
          <QrScannerDialog onScan={lookup} />
        </form>
        <FormAlert message={error} />

        {student && (
          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                firstName={student.firstName}
                lastName={student.lastName}
                photoUrl={student.photoUrl}
                className="size-16 text-base"
              />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold">
                  {student.firstName} {student.lastName}
                </div>
                <div className="text-muted-foreground text-sm">
                  {student.idNumber} · {student.course?.code} {student.yearLevel}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={student.remainingSessions > 0 ? "secondary" : "destructive"}>
                    {student.remainingSessions} session{student.remainingSessions === 1 ? "" : "s"} left
                  </Badge>
                  <Badge variant="outline">{student.pointsBalance} points</Badge>
                  {student.status !== "ACTIVE" && <Badge variant="destructive">{student.status.toLowerCase()}</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} aria-label="Clear">
                <X />
              </Button>
            </div>

            <div className="mt-4 border-t pt-4">
              {student.activeSitIn ? (
                <div className="grid gap-3">
                  <p className="text-sm">
                    In <strong>{student.activeSitIn.lab.name}</strong>, PC {student.activeSitIn.computer?.number} ·{" "}
                    {student.activeSitIn.language.name} ·{" "}
                    <Countdown
                      endsAt={new Date(student.activeSitIn.endsAt).toISOString()}
                      warnBeforeMinutes={warnBeforeMinutes}
                    />
                  </p>
                  <SitInActions
                    sitInId={student.activeSitIn.id}
                    studentName={student.firstName}
                    rewardPoints={rewardPoints}
                    onDone={reset}
                  />
                </div>
              ) : student.status !== "ACTIVE" ? (
                <p className="text-destructive text-sm">This account isn&apos;t active, so it can&apos;t sit in.</p>
              ) : student.remainingSessions <= 0 ? (
                <p className="text-destructive text-sm">
                  No sessions left. They can earn more with behavior points, or you can adjust their sessions.
                </p>
              ) : (
                <>
                  {student.reservation && (
                    <p className="mb-3 rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-800 dark:text-emerald-200">
                      Booked today: {student.reservation.lab.name}, {student.reservation.slot}
                      {student.reservation.computer && `, PC ${student.reservation.computer.number}`}. Starting in that
                      lab uses this booking.
                    </p>
                  )}
                  <StartForm
                    key={student.id}
                    studentId={student.id}
                    studentName={student.firstName}
                    labs={labs}
                    languages={languages}
                    booking={student.reservation}
                    onStarted={reset}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StartForm({
  studentId,
  studentName,
  labs,
  languages,
  booking,
  onStarted,
}: {
  studentId: string;
  studentName: string;
  labs: Option[];
  languages: Option[];
  booking: LookupResult["reservation"];
  onStarted: () => void;
}) {
  // Pre-fill from today's booking; otherwise remember the desk's lab between students.
  const [labId, setLabId] = useState(
    () => booking?.lab.id ?? (typeof window === "undefined" ? "" : (localStorage.getItem("sitin.lab") ?? "")),
  );
  const [computers, setComputers] = useState<{ id: string; number: number }[] | null>(null);
  const [computerId, setComputerId] = useState("");
  const [languageId, setLanguageId] = useState(booking?.languageId ?? "");
  const [purpose, setPurpose] = useState(booking?.purpose ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!labId || !labs.some((l) => l.id === labId)) return;
    let cancelled = false;
    availableComputersAction({ labId, studentId }).then((r) => {
      if (cancelled) return;
      const list = r.ok ? r.data : [];
      setComputers(list);
      // Pre-select the booked PC when it's free.
      const booked = booking?.computer?.id;
      setComputerId(booked && booking?.lab.id === labId && list.some((c) => c.id === booked) ? booked : "");
    });
    return () => {
      cancelled = true;
    };
  }, [labId, labs, studentId, booking]);

  function start() {
    setError(undefined);
    startTransition(async () => {
      const result = await startSitInAction({ studentId, labId, computerId, languageId, purpose });
      if (!result.ok) {
        setError(result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] : result.error);
        // Someone may have just taken the PC: refresh the list.
        availableComputersAction({ labId, studentId }).then((r) => r.ok && setComputers(r.data));
        return;
      }
      toast.success(`${studentName} checked in`);
      onStarted();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <PickOne
          id="lab"
          label="Lab"
          value={labId}
          onChange={(v) => {
            setLabId(v);
            try {
              localStorage.setItem("sitin.lab", v);
            } catch {
              // Private mode: just don't remember.
            }
          }}
          options={labs.map((l) => ({ value: l.id, label: l.name }))}
        />
        <PickOne
          id="computer"
          label="Computer"
          value={computerId}
          onChange={setComputerId}
          disabled={!computers}
          placeholder={!labId ? "Pick a lab first" : computers?.length === 0 ? "No free PCs" : "Select…"}
          options={(computers ?? []).map((c) => ({ value: c.id, label: `PC ${c.number}` }))}
        />
        <PickOne
          id="language"
          label="Language"
          value={languageId}
          onChange={setLanguageId}
          options={languages.map((l) => ({ value: l.id, label: l.name }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="purpose">Purpose (optional)</Label>
        <Input
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          maxLength={200}
          placeholder="e.g. Java lab exercise 3"
        />
      </div>
      <FormAlert message={error} />
      <div className="flex justify-end">
        <Button onClick={start} disabled={pending || !labId || !computerId || !languageId}>
          <LogIn /> {pending ? "Starting…" : "Start sit-in"}
        </Button>
      </div>
    </div>
  );
}

function PickOne({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
