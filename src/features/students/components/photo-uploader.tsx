"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import type { ActionResult } from "@/lib/action-result";

const MAX_BYTES = 5 * 1024 * 1024;

/** Avatar with "change photo" / "remove" buttons. The server re-validates and re-encodes the image. */
export function PhotoUploader({
  firstName,
  lastName,
  photoUrl,
  upload,
  remove,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  upload: (file: File) => Promise<ActionResult<unknown>>;
  remove?: () => Promise<ActionResult<unknown>>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return void toast.error("Photo must be 5 MB or smaller.");
    startTransition(async () => {
      const result = await upload(file);
      if (result.ok) toast.success("Photo updated");
      else toast.error(result.error);
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar firstName={firstName} lastName={lastName} photoUrl={photoUrl} className="size-20 text-lg" />
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="photo-input"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => input.current?.click()}>
          <Camera /> {pending ? "Uploading…" : photoUrl ? "Change photo" : "Add photo"}
        </Button>
        {photoUrl && remove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await remove();
                if (!result.ok) toast.error(result.error);
              })
            }
          >
            <Trash2 /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
