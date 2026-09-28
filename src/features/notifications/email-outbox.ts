import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";

const MAX_ATTEMPTS = 5;

/**
 * Sends notifications flagged for email that haven't gone out yet. Runs right after each
 * server action (via `after()`) and from the cron job, so a failed send is retried later.
 * The conditional update claims each row first, so concurrent runs never double-send.
 */
export async function flushEmails(limit = 50) {
  const due = await db.notification.findMany({
    where: { sendEmail: true, emailedAt: null, emailAttempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { user: { select: { email: true, firstName: true, status: true } } },
  });

  let sent = 0;
  for (const n of due) {
    // Claim: mark as sent before sending; undone below if the send fails.
    const { count } = await db.notification.updateMany({
      where: { id: n.id, emailedAt: null },
      data: { emailedAt: new Date(), emailAttempts: { increment: 1 } },
    });
    if (!count || n.user.status !== "ACTIVE") continue;
    try {
      const link = n.link ? `\n\nOpen: ${env.APP_URL}${n.link}` : "";
      await sendEmail({ to: n.user.email, subject: n.title, text: `Hi ${n.user.firstName},\n\n${n.body}${link}\n` });
      sent++;
    } catch (e) {
      console.error("[email-outbox]", e);
      await db.notification.update({ where: { id: n.id }, data: { emailedAt: null } });
    }
  }
  return { sent, pending: due.length - sent };
}
