import { listTargets } from "@/lib/actions/targets";
import { TargetsView } from "@/components/targets/TargetsView";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  const targets = await listTargets();
  return <TargetsView targets={targets} />;
}
