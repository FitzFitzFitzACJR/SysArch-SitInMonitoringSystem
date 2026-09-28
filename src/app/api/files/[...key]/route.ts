import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readLocalFile } from "@/lib/storage";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  pdf: "application/pdf",
};

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

  const ext = key.split(".").pop() ?? "";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable", // keys change whenever the file does
      "X-Content-Type-Options": "nosniff",
    },
  });
}
