/**
 * Run the Fall 26 PlayerData sync from the command line.
 *
 * Same pipeline as the Fall 26 Refresh button (lib/playerdata/sync.ts).
 * Defaults to a DRY RUN: reads Drive + Supabase, but writes the session JSONs
 * to a local folder instead of uploading, and doesn't touch the processed log.
 *
 * Usage (from the repo root; needs .env.local):
 *   npx tsx --env-file=.env.local scripts/fall26_sync.ts             # dry run → data/fall26-preview/
 *   npx tsx --env-file=.env.local scripts/fall26_sync.ts --out <dir> # dry run → <dir>
 *   npx tsx --env-file=.env.local scripts/fall26_sync.ts --write     # real sync → Supabase
 */

import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { syncFall26 } from "@/lib/playerdata/sync";

async function main() {
  const args   = process.argv.slice(2);
  const write  = args.includes("--write");
  const outIdx = args.indexOf("--out");
  const outDir = outIdx >= 0 ? args[outIdx + 1] : "data/fall26-preview"; // /data is gitignored

  console.log(write ? "Fall 26 sync — WRITING to Supabase\n" : "Fall 26 sync — dry run (nothing uploaded)\n");
  const report = await syncFall26({ dryRun: !write });

  if (!write && report.newSessions.length) {
    mkdirSync(outDir, { recursive: true });
    for (const s of report.newSessions) {
      writeFileSync(path.join(outDir, `${s.date}.json`), JSON.stringify(s, null, 2));
    }
    console.log(`Wrote ${report.newSessions.length} session JSON(s) to ${outDir}/\n`);
  }

  console.log("Files parsed:   ", report.processedFiles.join(", ") || "none (nothing new in Drive)");
  console.log(`${write ? "Uploaded" : "Would upload"}:  `, report.newDates.join(", ") || "none");
  console.log("Already stored: ", report.skippedDates.join(", ") || "none");
  if (report.failedFiles.length) {
    console.log("\nFAILED FILES (left unprocessed):");
    report.failedFiles.forEach((f) => console.log(`  ${f.file}: ${f.error}`));
  }
  if (report.warnings.length) {
    console.log("\nWarnings:");
    report.warnings.forEach((w) => console.log(`  - ${w}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
