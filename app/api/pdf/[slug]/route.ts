import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const filename = PDF_FILENAMES[params.slug];
  if (!filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.storage
    .from("reports")
    .createSignedUrl(`pdfs_25-26/${filename}`, 60 * 60);

  if (error || !data?.signedUrl) {
    console.error("[pdf api] slug:", params.slug, "file:", filename, "error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }

  console.log("[pdf api] signed url ok for", filename);
  return NextResponse.json({ url: data.signedUrl });
}
