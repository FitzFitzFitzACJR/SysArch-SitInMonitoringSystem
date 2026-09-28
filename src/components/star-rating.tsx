"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["Very poor", "Poor", "Okay", "Good", "Excellent"];

/**
 * 1–5 star picker built on a native radio group, so it works with the keyboard (arrow
 * keys) and screen readers ("4 stars, Good").
 */
export function StarRating({
  value,
  onChange,
  name,
  invalid,
}: {
  value: number;
  onChange: (v: number) => void;
  name: string;
  invalid?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Rating" aria-invalid={invalid} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="peer sr-only"
            aria-label={`${n} star${n === 1 ? "" : "s"}, ${LABELS[n - 1]}`}
          />
          <Star
            aria-hidden
            className={cn(
              "peer-focus-visible:ring-ring size-7 rounded transition peer-focus-visible:ring-2",
              n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            )}
          />
        </label>
      ))}
      <span className="text-muted-foreground ml-2 text-sm">{value ? LABELS[value - 1] : ""}</span>
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn("size-3.5", n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}
