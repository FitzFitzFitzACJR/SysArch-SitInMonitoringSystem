"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// One shared ticking clock for every countdown on the page.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
  listeners.add(cb);
  timer ??= setInterval(() => listeners.forEach((l) => l()), 15_000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
// Snapshot changes once per 15s tick, so renders stay stable between ticks.
const snapshot = () => Math.floor(Date.now() / 15_000) * 15_000;

export function useNow() {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}

/** "42 min left", amber inside the warning window, red once overdue. Refreshes the page at zero. */
export function Countdown({ endsAt, warnBeforeMinutes }: { endsAt: string; warnBeforeMinutes: number }) {
  const now = useNow();
  const router = useRouter();
  const refreshed = useRef(false);
  const end = new Date(endsAt).getTime();
  // Whole minutes remaining (the shared clock is up to 15s behind, so rounding up would overstate).
  const msLeft = now ? end - now : null;
  const minutes = msLeft === null ? null : Math.floor(msLeft / 60_000);

  // When time runs out, ask the server for fresh state (the page's sweep ends the sit-in).
  useEffect(() => {
    if (msLeft !== null && msLeft <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [msLeft, router]);

  if (msLeft === null || minutes === null) return <span className="text-muted-foreground">…</span>;
  const label =
    msLeft <= 0
      ? "Time's up"
      : minutes < 1
        ? "Under a minute left"
        : minutes < 60
          ? `${minutes} min left`
          : `${Math.floor(minutes / 60)} h ${minutes % 60} min left`;
  return (
    <span
      className={cn(
        "tabular-nums",
        msLeft <= 0 && "text-destructive font-medium",
        msLeft > 0 && minutes < warnBeforeMinutes && "font-medium text-amber-700 dark:text-amber-400",
      )}
    >
      {label}
    </span>
  );
}
