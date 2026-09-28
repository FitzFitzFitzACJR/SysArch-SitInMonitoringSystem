import { describe, expect, it } from "vitest";
import { AnnouncementSchema } from "@/features/announcements/schemas";
import { FeedbackSchema } from "@/features/feedback/schemas";
import { ResourceSchema } from "@/features/resources/schemas";
import { toLocalInputValue } from "@/lib/format";

const post = {
  title: "Lab 524 closed Friday",
  body: "Aircon repair.\nSorry!",
  pinned: false,
  publishAt: "",
  expiresAt: "",
  audience: "ALL" as const,
  labId: "",
  courseId: "",
};

describe("AnnouncementSchema", () => {
  it("treats empty dates as 'now' and 'never'", () => {
    const out = AnnouncementSchema.parse(post);
    expect(out.publishAt).toBeNull();
    expect(out.expiresAt).toBeNull();
  });

  it("requires a target for lab and course audiences", () => {
    expect(AnnouncementSchema.safeParse({ ...post, audience: "LAB" }).success).toBe(false);
    expect(AnnouncementSchema.safeParse({ ...post, audience: "COURSE", courseId: "c1" }).success).toBe(true);
  });

  it("rejects an expiry before the publish time", () => {
    const r = AnnouncementSchema.safeParse({ ...post, publishAt: "2026-10-02T08:00", expiresAt: "2026-10-01T08:00" });
    expect(r.success).toBe(false);
  });
});

describe("FeedbackSchema", () => {
  const fb = { labId: "l1", rating: "4", category: "STAFF", comments: "Very helpful staff", suggestions: "" };
  it("coerces the rating and empties optional fields to null", () => {
    const out = FeedbackSchema.parse(fb);
    expect(out.rating).toBe(4);
    expect(out.suggestions).toBeNull();
  });
  it("requires a 1–5 rating", () => {
    expect(FeedbackSchema.safeParse({ ...fb, rating: 0 }).success).toBe(false);
    expect(FeedbackSchema.safeParse({ ...fb, rating: 6 }).success).toBe(false);
  });
});

describe("ResourceSchema", () => {
  it("only accepts http(s) links", () => {
    expect(ResourceSchema.safeParse({ title: "Guide", url: "https://example.edu/guide.pdf" }).success).toBe(true);
    expect(ResourceSchema.safeParse({ title: "Evil", url: "javascript:alert(1)" }).success).toBe(false);
    expect(ResourceSchema.safeParse({ title: "Evil", url: "data:text/html,<script>" }).success).toBe(false);
  });
});

describe("toLocalInputValue", () => {
  it("formats an instant for datetime-local inputs in the lab's timezone", () => {
    expect(toLocalInputValue(new Date("2026-09-28T10:00:00Z"), "Asia/Manila")).toBe("2026-09-28T18:00");
  });
});
