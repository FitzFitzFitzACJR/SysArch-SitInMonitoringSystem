import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

// OWASP-recommended argon2id parameters (19 MiB, 2 iterations).
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/** Hashes imported from the PHP app are bcrypt ($2y$ is PHP's name for the same algorithm as $2b$). */
export function isLegacyHash(passwordHash: string): boolean {
  return /^\$2[aby]\$/.test(passwordHash);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    if (isLegacyHash(passwordHash)) {
      return await bcrypt.compare(password, passwordHash.replace(/^\$2y\$/, "$2b$"));
    }
    return await verify(passwordHash, password);
  } catch {
    // Malformed hash: treat as a failed login rather than a server error.
    return false;
  }
}

// Verified against when the user doesn't exist, so response time doesn't reveal valid ID numbers.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing");
  await verify(await dummyHash, password);
  return false;
}
