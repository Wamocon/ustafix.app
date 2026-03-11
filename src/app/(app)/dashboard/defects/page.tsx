import { getAllDefects } from "@/lib/actions/aggregate";
import { AllDefectsContent } from "@/components/dashboard/all-defects-content";

export default async function AllDefectsPage() {
  const defects = await getAllDefects();
  return <AllDefectsContent defects={defects} />;
}
