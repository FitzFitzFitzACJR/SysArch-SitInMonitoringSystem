import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { hashPassword, isLegacyHash, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes with argon2id and verifies", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(isLegacyHash(hash)).toBe(false);
    expect(await verifyPassword(hash, "s3cret-pass")).toBe(true);
    expect(await verifyPassword(hash, "wrong-pass1")).toBe(false);
  });

  it("verifies bcrypt hashes imported from PHP ($2y$ prefix)", async () => {
    // PHP's password_hash() writes $2y$; the algorithm is identical to $2b$.
    const php = (await bcrypt.hash("student123", 10)).replace(/^\$2b\$/, "$2y$");
    expect(isLegacyHash(php)).toBe(true);
    expect(await verifyPassword(php, "student123")).toBe(true);
    expect(await verifyPassword(php, "nope")).toBe(false);
  });

  it("treats a malformed hash as a failed login instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});
