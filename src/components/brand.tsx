import { MonitorCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
        <MonitorCheck className="size-4" aria-hidden />
      </span>
      <span className="leading-tight">
        CCS Sit-In
        <span className="text-muted-foreground block text-xs font-normal">Monitoring System</span>
      </span>
    </div>
  );
}
