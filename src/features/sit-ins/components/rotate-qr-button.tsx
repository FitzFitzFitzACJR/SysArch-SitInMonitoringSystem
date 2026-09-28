"use client";

import { RefreshCw } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { rotateQrAction } from "../actions";

export function RotateQrButton() {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="sm">
          <RefreshCw /> Get a new code
        </Button>
      }
      title="Replace your QR code?"
      description="Your current code (and any screenshots of it) stops working. Use this if someone else may have a copy."
      confirmLabel="Replace code"
      successMessage="New QR code ready"
      action={() => rotateQrAction({})}
    />
  );
}
