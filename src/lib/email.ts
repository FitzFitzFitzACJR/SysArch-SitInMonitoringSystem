import "server-only";
import { env } from "./env";

export type Email = { to: string; subject: string; text: string; html?: string };

/**
 * Sends through Resend's HTTP API. Without RESEND_API_KEY (local development) the email is
 * printed to the server console instead, so every flow still works end to end.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.info(`\n📧 [email] To: ${email.to}\n   Subject: ${email.subject}\n\n${email.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...email }),
  });
  if (!res.ok) {
    // Thrown so the outbox keeps the email queued and retries it later.
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}
