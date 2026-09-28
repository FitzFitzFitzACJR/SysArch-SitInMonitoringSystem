"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resizeLabAction } from "../actions";
import { MAX_COMPUTERS_PER_LAB } from "../schemas";

/** Change how many PCs a lab has. Removal takes the highest numbers and refuses PCs with history. */
export function ResizeLabForm({ labId, count }: { labId: string; count: number }) {
  const [value, setValue] = useState(String(count));
  const [pending, startTransition] = useTransition();
  const next = Number(value);
  const valid = Number.isInteger(next) && next >= 1 && next <= MAX_COMPUTERS_PER_LAB;

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await resizeLabAction({ labId, computerCount: next });
          if (result.ok) toast.success(`Lab now has ${next} computers`);
          else toast.error(result.error);
        });
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="computer-count">Number of computers</Label>
        <Input
          id="computer-count"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_COMPUTERS_PER_LAB}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28"
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending || !valid || next === count}>
        {pending
          ? "Saving…"
          : next < count
            ? `Remove ${count - next}`
            : next > count
              ? `Add ${next - count}`
              : "Update"}
      </Button>
    </form>
  );
}
