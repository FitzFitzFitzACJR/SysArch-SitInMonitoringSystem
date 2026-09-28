import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { ResourceList } from "@/features/resources/components/resource-list";
import { listResources } from "@/features/resources/service";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Lab resources" };

export default async function ResourcesPage() {
  await requireStudent();
  const resources = await listResources(true);
  return (
    <>
      <PageHeader title="Lab resources" description="Guides, handouts and links from the lab staff." />
      <ResourceList resources={resources} />
    </>
  );
}
