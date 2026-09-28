"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createResourceAction } from "../actions";
import { RESOURCE_TYPES } from "../schemas";

export function AddResourceDialog() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"link" | "file">("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createResourceAction({
        title,
        description,
        url: kind === "link" ? url : null,
        file: kind === "file" ? file : null,
      });
      if (!result.ok) {
        return setError(result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] : result.error);
      }
      toast.success("Resource added");
      setTitle("");
      setDescription("");
      setUrl("");
      setFile(null);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a resource</DialogTitle>
          <DialogDescription>Share a link or upload a file (up to 5 MB) for students.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <FormAlert message={error} />
          <div className="grid gap-1.5">
            <Label htmlFor="resource-title">Title</Label>
            <Input id="resource-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="resource-description">Description (optional)</Label>
            <Textarea
              id="resource-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>
          <Tabs value={kind} onValueChange={(v) => setKind(v as "link" | "file")}>
            <TabsList>
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>
          </Tabs>
          {kind === "link" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="resource-url">Link</Label>
              <Input
                id="resource-url"
                type="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="resource-file">File</Label>
              <Input
                id="resource-file"
                type="file"
                accept={Object.keys(RESOURCE_TYPES)
                  .map((ext) => `.${ext}`)
                  .join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
          <Button type="submit" disabled={pending || !title.trim() || (kind === "link" ? !url : !file)}>
            {pending ? "Saving…" : "Add resource"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
