import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import { AppSidebar } from "./app-sidebar";
import { navFor } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** Sidebar layout shared by the student and staff areas (collapses to a drawer on phones). */
export async function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const { photoUrl } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { photoUrl: true } });
  return (
    <SidebarProvider>
      <a
        href="#main"
        className="bg-background sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AppSidebar items={navFor(user.role)} />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:px-4">
          <SidebarTrigger aria-label="Toggle navigation" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu name={user.name} idNumber={user.idNumber} role={user.role} photoUrl={photoUrl} />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
