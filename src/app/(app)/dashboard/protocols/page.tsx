import { getAllProtocols } from "@/lib/actions/aggregate";
import { AllProtocolsContent } from "@/components/dashboard/all-protocols-content";

export default async function AllProtocolsPage() {
  const protocols = await getAllProtocols();
  return <AllProtocolsContent protocols={protocols} />;
}
