"use client";

import { ScrollText } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { acceptRulesAction } from "../actions";

/** Shown on the student dashboard until the current version of the lab rules is accepted. */
export function RulesAcceptance({ rules, version, updated }: { rules: string; version: number; updated: boolean }) {
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="size-5" aria-hidden /> {updated ? "The lab rules were updated" : "Lab rules"}
        </CardTitle>
        <CardDescription>You need to accept these before you can check in to a lab.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 max-h-56 overflow-y-auto rounded-md p-3 text-sm whitespace-pre-wrap" tabIndex={0}>
          {rules}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          I&apos;ve read and will follow the lab rules
        </label>
        <Button
          disabled={!agreed || pending}
          onClick={() =>
            startTransition(async () => {
              const r = await acceptRulesAction({ version });
              if (r.ok) toast.success("Thanks! You're all set to check in.");
              else toast.error(r.error);
            })
          }
        >
          Accept rules
        </Button>
      </CardFooter>
    </Card>
  );
}
