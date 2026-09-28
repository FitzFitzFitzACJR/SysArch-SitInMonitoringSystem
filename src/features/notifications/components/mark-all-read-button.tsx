"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllReadAction } from "../actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllReadAction({});
          router.refresh();
        })
      }
    >
      <CheckCheck /> Mark all read
    </Button>
  );
}
