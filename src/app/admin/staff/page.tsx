import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSettings } from "@/features/settings/queries";
import { AddStaffDialog, StaffRoleSelect, StaffRowActions } from "@/features/staff/components/staff-controls";
import { listStaff } from "@/features/staff/queries";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Staff accounts" };

export default async function StaffPage() {
  const me = await requireStaff("staff:manage");
  const [staff, settings] = await Promise.all([listStaff(), getSettings()]);
  const fmt = dateTimeFormatter(settings.timezone);

  return (
    <>
      <PageHeader
        title="Staff accounts"
        description="Lab staff run sit-ins, computers and reservations. Super admins also manage settings, semesters and staff."
        actions={<AddStaffDialog />}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => {
              const row = {
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                role: s.role as "LAB_STAFF" | "SUPER_ADMIN",
                status: s.status,
                passwordPending: s.passwordPending,
              };
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {s.idNumber} · {s.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StaffRoleSelect row={row} isSelf={s.id === me.id} />
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {s.passwordPending ? "Invite pending" : s.lastLoginAt ? fmt.format(s.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    <StaffRowActions row={row} isSelf={s.id === me.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
