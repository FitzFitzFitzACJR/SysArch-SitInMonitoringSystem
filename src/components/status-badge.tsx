import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" | "ARCHIVED" }) {
  const variant = status === "ACTIVE" ? "secondary" : status === "INACTIVE" ? "outline" : "destructive";
  return <Badge variant={variant}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}
