import { getAllReports } from "@/lib/reports";
import { REPORT_SEASONS, ReportSeason } from "@/lib/seasons";
import { Report } from "@/types/report";
import DashboardClient from "@/components/DashboardClient";

export const revalidate = 300; // re-fetch from Supabase at most every 5 minutes

export default async function DashboardPage() {
  // load every season's reports up front so the season toggle switches instantly;
  // seasons marked unavailable return [] without hitting Supabase
  const seasons = Object.keys(REPORT_SEASONS) as ReportSeason[];
  const lists = await Promise.all(seasons.map((s) => getAllReports(s)));
  const reportsBySeason = Object.fromEntries(
    seasons.map((s, i) => [s, lists[i]])
  ) as Record<ReportSeason, Report[]>;

  return <DashboardClient reportsBySeason={reportsBySeason} />;
}
