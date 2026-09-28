import type { Metadata } from "next";
import { LeaderboardPage } from "@/features/points/components/leaderboard-page";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function StaffLeaderboardPage({ searchParams }: PageProps<"/admin/leaderboard">) {
  await requireStaff("points:award");
  const { semester } = await searchParams;
  return <LeaderboardPage semesterParam={typeof semester === "string" ? semester : undefined} />;
}
