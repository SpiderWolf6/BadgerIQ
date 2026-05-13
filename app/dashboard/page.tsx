import { getAllReports } from "@/lib/reports";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const reports = await getAllReports();
  return <DashboardClient reports={reports} />;
}
