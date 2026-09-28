import { NextResponse } from "next/server";
import { RESOURCE_TYPES } from "@/features/resources/schemas";
import { auth } from "@/lib/auth";
import { readLocalFile } from "@/lib/storage";

const TYPES: Record<string, string> = { webp: "image/webp", ...RESOURCE_TYPES };
const INLINE = new Set(["webp", "png", "jpg", "jpeg"]);

// Serves files from local storage in development. In production files live in Vercel Blob
// and are loaded from their Blob URL, so this route is never hit there.
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[...key]">) {
  if (!(await auth())) return new NextResponse("Unauthorized", { status: 401 });

  const key = (await ctx.params).key.join("/");
  let data: Buffer | null;
  try {
    data = await readLocalFile(key);
  } catch {
    data = null;
  }
  if (!data) return new NextResponse("Not found", { status: 404 });

  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      // Anything that isn't an image downloads instead of rendering, and the sandbox CSP
      // stops an uploaded file from ever running script on this origin.
      "Content-Disposition": INLINE.has(ext) ? "inline" : "attachment",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'",
      "Cache-Control": "private, max-age=31536000, immutable", // keys change whenever the file does
      "X-Content-Type-Options": "nosniff",
    },
  });
}
