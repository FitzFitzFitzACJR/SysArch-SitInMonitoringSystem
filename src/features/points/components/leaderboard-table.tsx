import { Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "../queries";

const MEDAL = ["text-amber-500", "text-zinc-400", "text-amber-700"];

/** Top N, plus the viewer's own row pinned underneath if they're outside it. */
export function LeaderboardTable({
  rows,
  highlightId,
  top = 10,
}: {
  rows: LeaderboardRow[];
  highlightId?: string;
  top?: number;
}) {
  const shown = rows.slice(0, top);
  const me = highlightId ? rows.find((r) => r.id === highlightId) : undefined;
  const meOutside = me && !shown.includes(me);

  const row = (r: LeaderboardRow) => (
    <TableRow
      key={r.id}
      className={cn(r.id === highlightId && "bg-primary/5 font-medium")}
      aria-current={r.id === highlightId ? "true" : undefined}
    >
      <TableCell className="w-16 text-center tabular-nums">
        {r.rank <= 3 ? (
          <span className="inline-flex items-center gap-1">
            <Medal className={cn("size-4", MEDAL[r.rank - 1])} aria-hidden /> {r.rank}
          </span>
        ) : (
          r.rank
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar firstName={r.firstName} lastName={r.lastName} photoUrl={r.photoUrl} />
          <div>
            {r.firstName} {r.lastName}
            {r.id === highlightId && <span className="text-muted-foreground"> (you)</span>}
            <div className="text-muted-foreground text-xs">
              {r.course?.code} {r.yearLevel}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{r.score}</TableCell>
    </TableRow>
  );

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Student</TableHead>
            <TableHead className="text-right">Sit-ins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                No completed sit-ins yet.
              </TableCell>
            </TableRow>
          )}
          {shown.map(row)}
          {meOutside && (
            <>
              <TableRow aria-hidden>
                <TableCell colSpan={3} className="text-muted-foreground py-1 text-center">
                  ⋯
                </TableCell>
              </TableRow>
              {row(me)}
            </>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
