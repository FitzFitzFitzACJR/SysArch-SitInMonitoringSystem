"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { bellAction, markAllReadAction, markReadAction, unreadCountAction } from "../actions";
import type { NotificationItem } from "../queries";
import { NotificationIcon } from "./notification-icon";

const POLL_MS = 60_000;

function timeAgo(date: Date) {
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** Header bell: unread badge (refreshed every minute), latest items loaded on open. */
export function NotificationBell({ initialUnread, allHref }: { initialUnread: number; allHref: string }) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.hidden) return; // don't poll from background tabs
      const r = await unreadCountAction({});
      if (r.ok) setUnread(r.data);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  function load() {
    startTransition(async () => {
      const r = await bellAction({});
      if (r.ok) {
        setItems(r.data.items);
        setUnread(r.data.unread);
      }
    });
  }

  function open(item: NotificationItem) {
    if (!item.readAt) {
      setUnread((n) => Math.max(0, n - 1));
      void markReadAction({ id: item.id });
    }
    if (item.link) router.push(item.link);
  }

  function markAll(e: React.MouseEvent) {
    e.preventDefault();
    setUnread(0);
    setItems((list) => list?.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })) ?? null);
    void markAllReadAction({});
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && load()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell />
          {unread > 0 && (
            <span className="bg-destructive absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unread > 0 && (
            <button
              type="button"
              className="text-muted-foreground text-xs font-normal hover:underline"
              onClick={markAll}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items === null && <p className="text-muted-foreground px-2 py-6 text-center text-sm">Loading…</p>}
        {items?.length === 0 && (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">You&apos;re all caught up.</p>
        )}
        {items?.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => open(item)} className="items-start gap-3 py-2">
            <NotificationIcon type={item.type} className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className={cn("text-sm", !item.readAt && "font-semibold")}>{item.title}</div>
              <div className="text-muted-foreground line-clamp-2 text-xs">{item.body}</div>
              <div className="text-muted-foreground mt-0.5 text-[11px]">{timeAgo(item.createdAt)}</div>
            </div>
            {!item.readAt && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-label="Unread" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={allHref} className="justify-center text-sm">
            See all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
