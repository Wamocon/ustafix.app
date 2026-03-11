import { getAllMembers } from "@/lib/actions/aggregate";
import { AllTeamContent } from "@/components/dashboard/all-team-content";

export default async function AllTeamPage() {
  const members = await getAllMembers();
  return <AllTeamContent members={members} />;
}
