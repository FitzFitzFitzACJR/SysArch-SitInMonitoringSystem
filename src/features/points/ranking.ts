// Pure leaderboard ranking, shared by the queries and unit tests.

export type Ranked<T> = T & { rank: number };

/**
 * "Competition" ranking (1, 2, 2, 4): tied scores share a rank and the next rank skips,
 * like the original system's `COUNT(*) + 1 of those strictly ahead`. Ties are listed
 * alphabetically so the order is stable between page loads.
 */
export function rankByScore<T extends { score: number; name: string }>(rows: T[]): Ranked<T>[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let rank = 0;
  let prev: number | undefined;
  return sorted.map((row, i) => {
    if (row.score !== prev) {
      rank = i + 1;
      prev = row.score;
    }
    return { ...row, rank };
  });
}
