"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ANY = "any";
type Option = { value: string; label: string };

/** Filters live in the URL: the page reads them server-side and the exports reuse them. */
export function ReportFilters({
  labs,
  courses,
  languages,
  from,
  to,
}: {
  labs: Option[];
  courses: Option[];
  languages: Option[];
  from: string;
  to: string;
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

  const select = (key: string, label: string, options: Option[], fallback = ANY, allLabel = "All") => {
    const value = params.get(key) ?? fallback;
    const all = fallback === ANY ? [{ value: ANY, label: allLabel }, ...options] : options;
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`f-${key}`} className="text-xs">
          {label}
        </Label>
        <Select value={value} onValueChange={(v) => set(key, v === fallback && fallback !== ANY ? null : v)}>
          <SelectTrigger id={`f-${key}`} className="w-full">
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
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <div className="grid gap-1.5">
        <Label htmlFor="f-from" className="text-xs">
          From
        </Label>
        <Input id="f-from" type="date" value={from} max={to} onChange={(e) => set("from", e.target.value || null)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="f-to" className="text-xs">
          To
        </Label>
        <Input id="f-to" type="date" value={to} min={from} onChange={(e) => set("to", e.target.value || null)} />
      </div>
      {select("labId", "Lab", labs, ANY, "All labs")}
      {select("courseId", "Course", courses, ANY, "All courses")}
      {select(
        "yearLevel",
        "Year level",
        [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` })),
        ANY,
        "All years",
      )}
      {select("languageId", "Language", languages, ANY, "All languages")}
      {select(
        "status",
        "Outcome",
        [
          { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "ALL", label: "Both" },
        ],
        "COMPLETED",
      )}
    </div>
  );
}
