import { notFound } from "next/navigation";
import { getReport } from "@/lib/reports";
import ReportView from "@/components/ReportView";
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: { slug: string };
}

export default async function ReportPage({ params }: Props) {
  const report = await getReport(params.slug);
  if (!report) notFound();

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#0a0a0b" }}
    >
      <header
        className="flex items-center h-12 px-4 border-b shrink-0"
        style={{ background: "#0d0d0e", borderColor: "#1a1a1c" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 relative">
            <Image src="/logo.png" alt="BadgerIQ" fill className="object-contain" />
          </div>
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: "#444" }}
          >
            ← Dashboard
          </span>
        </Link>
        <span className="font-display font-600 text-sm" style={{ color: "#888" }}>
          {report.opponent}
        </span>
      </header>

      <div className="flex-1 overflow-hidden">
        <ReportView report={report} />
      </div>
    </div>
  );
}
