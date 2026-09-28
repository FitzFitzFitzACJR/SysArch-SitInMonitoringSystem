"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CourseOption } from "./student-form";

const ANY = "any";

/** Search + filters, stored in the URL so results are linkable and survive reloads. */
export function StudentFilters({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value && value !== ANY) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // new filter → back to page 1
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Debounce typing so we don't navigate on every keystroke.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update("q", q.trim() || null), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ID, name or email"
          className="pl-8"
          aria-label="Search students"
          type="search"
        />
      </div>
      <FilterSelect
        label="Course"
        value={params.get("courseId") ?? ANY}
        onChange={(v) => update("courseId", v)}
        options={[{ value: ANY, label: "All courses" }, ...courses.map((c) => ({ value: c.id, label: c.code }))]}
      />
      <FilterSelect
        label="Year level"
        value={params.get("yearLevel") ?? ANY}
        onChange={(v) => update("yearLevel", v)}
        options={[
          { value: ANY, label: "All years" },
          ...[1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` })),
        ]}
      />
      <FilterSelect
        label="Status"
        value={params.get("status") ?? "ACTIVE"}
        onChange={(v) => update("status", v === "ACTIVE" ? null : v)}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
          { value: "ARCHIVED", label: "Archived" },
          { value: "ALL", label: "All statuses" },
        ]}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full sm:w-36">
        <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
