import { PageHeader } from "@/components/layout/app-shell";
import { UrlSelect } from "@/components/url-select";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { getLeaderboard } from "../queries";
import { LeaderboardTable } from "./leaderboard-table";

/** Shared by the student and staff routes. `semesterParam`: a semester id, "all", or undefined (current). */
export async function LeaderboardPage({
  semesterParam,
  highlightId,
}: {
  semesterParam?: string;
  highlightId?: string;
}) {
  const settings = await getSettings();
  const [semesters, current] = await Promise.all([
    db.semester.findMany({ orderBy: { startsOn: "desc" }, select: { id: true, name: true } }),
    getCurrentSemester(settings.timezone),
  ]);
  const selected =
    semesterParam === "all" ? "all" : (semesters.find((s) => s.id === semesterParam)?.id ?? current?.id ?? "all");
  const rows = await getLeaderboard(selected === "all" ? null : selected);

  return (
    <>
      <PageHeader
        title="Attendance leaderboard"
        description="Ranked by completed sit-ins. Students with the same count share a rank."
        actions={
          <UrlSelect
            param="semester"
            label="Semester"
            value={selected}
            className="w-full sm:w-64"
            options={[...semesters.map((s) => ({ value: s.id, label: s.name })), { value: "all", label: "All time" }]}
          />
        }
      />
      <LeaderboardTable rows={rows} highlightId={highlightId} top={highlightId ? 10 : 50} />
    </>
  );
}
