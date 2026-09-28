import type { Metadata } from "next";
import { LeaderboardPage } from "@/features/points/components/leaderboard-page";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function StudentLeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const user = await requireStudent();
  const { semester } = await searchParams;
  return <LeaderboardPage semesterParam={typeof semester === "string" ? semester : undefined} highlightId={user.id} />;
}
