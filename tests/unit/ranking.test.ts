import { describe, expect, it } from "vitest";
import { rankByScore } from "@/features/points/ranking";

describe("rankByScore", () => {
  it("gives tied scores the same rank and skips the next", () => {
    const ranked = rankByScore([
      { name: "Cruz", score: 5 },
      { name: "Ana", score: 9 },
      { name: "Bea", score: 5 },
      { name: "Dan", score: 2 },
    ]);
    expect(ranked.map((r) => [r.name, r.rank])).toEqual([
      ["Ana", 1],
      ["Bea", 2],
      ["Cruz", 2],
      ["Dan", 4],
    ]);
  });

  it("handles an empty board", () => {
    expect(rankByScore([])).toEqual([]);
  });
});
