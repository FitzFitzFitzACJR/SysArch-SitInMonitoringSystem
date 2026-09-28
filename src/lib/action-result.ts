// Kept separate from lib/action.ts (server-only) so client components can import the type.
export type ActionResult<T = void> =
  { ok: true; data: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
