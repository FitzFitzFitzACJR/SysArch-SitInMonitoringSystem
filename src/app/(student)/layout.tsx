import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/session";

// Layouts don't re-render on client-side navigation, so each page also calls its own
// require*() guard; this one just decides which shell to render.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  return <AppShell user={user}>{children}</AppShell>;
}
