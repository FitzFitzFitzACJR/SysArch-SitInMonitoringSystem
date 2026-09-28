import { Prisma } from "@/generated/prisma/client";
import { DomainError } from "./errors";

/**
 * Turns a unique-constraint violation into a field-level DomainError, e.g.
 * uniqueViolation(e, { email: "That email is already registered." }).
 * Returns undefined for any other error so callers can rethrow it.
 */
export function uniqueViolation(e: unknown, messages: Record<string, string>): DomainError | undefined {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return undefined;
  // With driver adapters the target comes back under meta.target or meta.driverAdapterError.
  const target = JSON.stringify(e.meta ?? {});
  for (const [field, message] of Object.entries(messages)) {
    if (target.includes(field)) return new DomainError(message, { [field]: [message] });
  }
  return new DomainError("That record already exists.");
}
