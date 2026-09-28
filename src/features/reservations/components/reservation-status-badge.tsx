import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/generated/prisma/enums";

const LABELS: Record<
  ReservationStatus,
  { text: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { text: "Pending", variant: "outline" },
  APPROVED: { text: "Approved", variant: "default" },
  REJECTED: { text: "Declined", variant: "destructive" },
  CANCELLED: { text: "Cancelled", variant: "outline" },
  NO_SHOW: { text: "No-show", variant: "destructive" },
  FULFILLED: { text: "Checked in", variant: "secondary" },
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { text, variant } = LABELS[status];
  return <Badge variant={variant}>{text}</Badge>;
}
