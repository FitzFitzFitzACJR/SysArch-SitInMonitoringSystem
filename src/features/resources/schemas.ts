import { z } from "zod";

export const MAX_RESOURCE_BYTES = 5 * 1024 * 1024;

/** Allowed uploads and the Content-Type we serve them with (never the browser's claim). */
export const RESOURCE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export const ResourceSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(150),
  description: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((v) => v || null),
  // Only http(s): blocks javascript: and data: links.
  url: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null)
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Use a full http(s):// link"),
  file: z.instanceof(File).nullish(),
});

export const ResourceIdSchema = z.object({ id: z.string().min(1) });
export const ResourceActiveSchema = ResourceIdSchema.extend({ isActive: z.boolean() });

export type ResourceInput = z.output<typeof ResourceSchema>;
