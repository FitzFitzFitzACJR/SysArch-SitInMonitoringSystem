"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ANY = "any";

export function AuditFilters({
  from,
  to,
  areas,
  actors,
}: {
  from: string;
  to: string;
  areas: string[];
  actors: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value && value !== ANY) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const pick = (key: string, label: string, options: { value: string; label: string }[], allLabel: string) => {
    const value = params.get(key) ?? ANY;
    const all = [{ value: ANY, label: allLabel }, ...options];
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`a-${key}`} className="text-xs">
          {label}
        </Label>
        <Select value={value} onValueChange={(v) => set(key, v)}>
          <SelectTrigger id={`a-${key}`} className="w-full">
            <SelectValue>{all.find((o) => o.value === value)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {all.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="grid gap-1.5">
        <Label htmlFor="a-from" className="text-xs">
          From
        </Label>
        <Input id="a-from" type="date" value={from} max={to} onChange={(e) => set("from", e.target.value || null)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="a-to" className="text-xs">
          To
        </Label>
        <Input id="a-to" type="date" value={to} min={from} onChange={(e) => set("to", e.target.value || null)} />
      </div>
      {pick(
        "area",
        "Area",
        areas.map((a) => ({ value: a, label: a })),
        "All areas",
      )}
      {pick("actorId", "Staff member", actors, "Everyone")}
    </div>
  );
}
