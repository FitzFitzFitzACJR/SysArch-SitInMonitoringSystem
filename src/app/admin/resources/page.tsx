import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { AddResourceDialog } from "@/features/resources/components/add-resource-dialog";
import { ResourceList } from "@/features/resources/components/resource-list";
import { ResourceRowActions } from "@/features/resources/components/resource-row-actions";
import { listResources } from "@/features/resources/service";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Lab resources" };

export default async function AdminResourcesPage() {
  await requireStaff("resource:manage");
  const resources = await listResources(false);
  return (
    <>
      <PageHeader
        title="Lab resources"
        description="Guides, handouts and links for students."
        actions={<AddResourceDialog />}
      />
      <ResourceList
        resources={resources}
        showStatus
        actions={(r) => <ResourceRowActions id={r.id} title={r.title} isActive={r.isActive} />}
      />
    </>
  );
}
