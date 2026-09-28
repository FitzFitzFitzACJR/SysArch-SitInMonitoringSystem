import { CalendarDays, Clock, Coins, Info, Megaphone, TriangleAlert, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/generated/prisma/enums";

const ICONS: Record<NotificationType, LucideIcon> = {
  RESERVATION: CalendarDays,
  SIT_IN: Clock,
  POINTS: Coins,
  ANNOUNCEMENT: Megaphone,
  ISSUE: TriangleAlert,
  SYSTEM: Info,
};

export function NotificationIcon({ type, className }: { type: NotificationType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden />;
}
