import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { StudentLabMap } from "@/features/lab-map/components/student-lab-map";
import { getLabSnapshot, publicSnapshot } from "@/features/lab-map/snapshot";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Lab availability" };

export default async function LabMapPage({ searchParams }: PageProps<"/lab-map">) {
  await requireStudent();
  const labs = await db.lab.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const { lab } = await searchParams;
  const labId = typeof lab === "string" && labs.some((l) => l.id === lab) ? lab : labs[0]?.id;
  const snapshot = labId ? await getLabSnapshot(labId) : null;

  return (
    <>
      <PageHeader
        title="Lab availability"
        description="See which computers are free before you head to the lab."
        actions={
          labId && (
            <UrlSelect
              param="lab"
              label="Lab"
              value={labId}
              options={labs.map((l) => ({ value: l.id, label: l.name }))}
            />
          )
        }
      />
      <Card>
        <CardContent>
          {snapshot ? (
            <StudentLabMap initial={publicSnapshot(snapshot)} />
          ) : (
            <p className="text-muted-foreground">No labs are open.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
