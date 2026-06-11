import { notFound } from "next/navigation";
import { getTarget } from "@/lib/actions/targets";
import { listCategories } from "@/lib/actions/questions";
import { TargetDetailView } from "@/components/targets/TargetDetailView";

export const dynamic = "force-dynamic";

export default async function TargetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, categories] = await Promise.all([
    getTarget(id),
    listCategories(),
  ]);
  if (!detail) notFound();

  return <TargetDetailView detail={detail} categories={categories} />;
}
