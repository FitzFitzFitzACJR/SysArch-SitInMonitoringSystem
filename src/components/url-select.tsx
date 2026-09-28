"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** A select whose value lives in a URL search param, so server pages can filter on it. */
export function UrlSelect({
  param,
  label,
  value,
  options,
  className,
}: {
  param: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = new URLSearchParams(params);
        next.set(param, v);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger aria-label={label} className={className ?? "w-full sm:w-48"}>
        {/* Explicit label: Radix only knows item text once the list has mounted, so SSR would show blank. */}
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
