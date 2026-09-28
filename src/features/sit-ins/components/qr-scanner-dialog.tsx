"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QR_PREFIX } from "../schemas";

/**
 * Camera QR scanner. qr-scanner is loaded only when the dialog opens (it's ~50 KB and
 * needs `window`), and uses the browser's native BarcodeDetector when available.
 * USB/Bluetooth barcode scanners don't need this: they "type" into the lookup box.
 */
export function QrScannerDialog({ onScan }: { onScan: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let scanner: { stop(): void; destroy(): void } | undefined;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (stopped || !video.current) return;
      if (!(await QrScanner.hasCamera())) return setError("No camera found on this device.");
      const instance = new QrScanner(
        video.current,
        (result) => {
          // Ignore QR codes that aren't ours (menus, Wi-Fi codes…) and keep scanning.
          if (!result.data.startsWith(QR_PREFIX)) return;
          instance.stop();
          setOpen(false);
          onScan(result.data);
        },
        { preferredCamera: "environment", highlightScanRegion: true, maxScansPerSecond: 8 },
      );
      scanner = instance;
      try {
        await instance.start();
      } catch {
        setError("Couldn't open the camera. Allow camera access for this site and try again.");
      }
    })();

    return () => {
      stopped = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [open, onScan]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Camera /> Scan with camera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan a student&apos;s QR code</DialogTitle>
          <DialogDescription>Hold the code from their profile page up to the camera.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : (
          <video ref={video} className="aspect-square w-full rounded-md bg-black object-cover" muted playsInline />
        )}
      </DialogContent>
    </Dialog>
  );
}
