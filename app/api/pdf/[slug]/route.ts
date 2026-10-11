import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { REPORT_SEASONS, DEFAULT_REPORT_SEASON, isReportSeason } from "@/lib/seasons";

const PDF_FILENAMES: Record<string, string> = {
  washington: "Washington_Scouting_Report.pdf",
  "ohio-state": "Ohio_Scouting_Report.pdf",
  ucla: "UCLA_Scouting_Report.pdf",
  rutgers: "Rutgers_Scouting_Report.pdf",
  indiana: "Indiana_Scouting_Report.pdf",
  michigan: "Michigan_Scouting_Report.pdf",
  "michigan-state": "Michigan_State_Scouting_Report.pdf",
  "penn-state": "Penn_State_Scouting_Report.pdf",
  northwestern: "Northwestern_Scouting_Report.pdf",
};

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  // ?season=fall25 (default) picks which season's pdf folder to read from
  const seasonParam = new URL(req.url).searchParams.get("season");
  const season = isReportSeason(seasonParam) ? seasonParam : DEFAULT_REPORT_SEASON;

  const filename = PDF_FILENAMES[params.slug];
  if (!filename || !REPORT_SEASONS[season].available) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.storage
    .from("reports")
    .createSignedUrl(`${REPORT_SEASONS[season].pdfDir}/${filename}`, 60 * 60);

  if (error || !data?.signedUrl) {
    console.error("[pdf api] slug:", params.slug, "file:", filename, "error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }

  console.log("[pdf api] signed url ok for", filename);
  return NextResponse.json({ url: data.signedUrl });
}
