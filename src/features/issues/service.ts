import "server-only";
import { db } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/features/audit/service";
import { notify, notifyStaff } from "@/features/notifications/service";
import { ISSUE_CATEGORY_LABELS, type ReportIssueInput } from "./schemas";

type Actor = { id: string; ip: string | null };

/**
 * A student reports a problem with the PC they're using. The PC is flagged for maintenance
 * so it isn't given to anyone else, but their session continues and upcoming bookings are
 * left for staff to judge (a broken mouse is a 5-minute fix; locking the PC in the lab
 * page is what cancels bookings for longer outages).
 */
export async function reportIssue(studentId: string, input: ReportIssueInput) {
  return db.$transaction(async (tx) => {
    const sitIn = await tx.sitIn.findFirst({
      where: { studentId, status: "ACTIVE" },
      include: { computer: true, lab: true, student: { select: { firstName: true, lastName: true } } },
    });
    if (!sitIn?.computer) throw new DomainError("You can report a problem with the computer you're checked in to.");

    const duplicate = await tx.computerIssue.findFirst({
      where: { computerId: sitIn.computer.id, reporterId: studentId, status: { not: "RESOLVED" } },
    });
    if (duplicate)
      throw new DomainError("You've already reported a problem with this computer. The lab staff are on it.");

    const issue = await tx.computerIssue.create({
      data: {
        computerId: sitIn.computer.id,
        reporterId: studentId,
        sitInId: sitIn.id,
        category: input.category,
        description: input.description,
      },
    });
    if (sitIn.computer.state === "ACTIVE") {
      await tx.computer.update({
        where: { id: sitIn.computer.id },
        data: { state: "MAINTENANCE", note: ISSUE_CATEGORY_LABELS[input.category] },
      });
    }
    await notifyStaff(tx, {
      type: "ISSUE",
      title: `Problem reported: ${sitIn.lab.name}, PC ${sitIn.computer.number}`,
      body: `${ISSUE_CATEGORY_LABELS[input.category]} — ${input.description} (${sitIn.student.firstName} ${sitIn.student.lastName})`,
      link: "/admin/issues",
    });
    return issue;
  });
}

export async function updateIssueStatus(
  id: string,
  status: "IN_PROGRESS" | "RESOLVED",
  returnToService: boolean,
  actor: Actor,
) {
  return db.$transaction(async (tx) => {
    const issue = await tx.computerIssue.findUnique({
      where: { id },
      include: { computer: { include: { lab: true } } },
    });
    if (!issue) throw new NotFoundError("Issue");
    if (issue.status === "RESOLVED") throw new DomainError("This issue is already resolved.");

    await tx.computerIssue.update({
      where: { id },
      data: status === "RESOLVED" ? { status, resolvedById: actor.id, resolvedAt: new Date() } : { status },
    });

    let backInService = false;
    if (status === "RESOLVED") {
      const stillOpen = await tx.computerIssue.count({
        where: { computerId: issue.computerId, status: { not: "RESOLVED" }, id: { not: id } },
      });
      // Only undo the maintenance flag; a PC staff deliberately locked stays locked.
      if (returnToService && stillOpen === 0 && issue.computer.state === "MAINTENANCE") {
        await tx.computer.update({ where: { id: issue.computerId }, data: { state: "ACTIVE", note: null } });
        backInService = true;
      }
      await notify(tx, issue.reporterId, {
        type: "ISSUE",
        title: "Your report was resolved",
        body: `Thanks for reporting the problem with ${issue.computer.lab.name}, PC ${issue.computer.number}. It's been fixed.`,
      });
    }

    await writeAudit(tx, {
      actorId: actor.id,
      action: status === "RESOLVED" ? "issue.resolve" : "issue.start",
      entityType: "ComputerIssue",
      entityId: id,
      details: { lab: issue.computer.lab.code, pc: issue.computer.number, backInService },
      ipAddress: actor.ip,
    });
    return { backInService };
  });
}

export function listIssues(status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "UNRESOLVED") {
  return db.computerIssue.findMany({
    where: status === "UNRESOLVED" ? { status: { not: "RESOLVED" } } : { status },
    orderBy: status === "RESOLVED" ? { resolvedAt: "desc" } : { createdAt: "asc" },
    take: 100,
    include: {
      computer: { select: { number: true, state: true, lab: { select: { id: true, name: true } } } },
      reporter: { select: { id: true, firstName: true, lastName: true, idNumber: true } },
      resolvedBy: { select: { firstName: true, lastName: true } },
    },
  });
}
