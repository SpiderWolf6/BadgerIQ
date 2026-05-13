import { getAllReports } from "@/lib/reports";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 300; // re-fetch from Supabase at most every 5 minutes

export default async function DashboardPage() {
  const reports = await getAllReports();
  return <DashboardClient reports={reports} />;
}
