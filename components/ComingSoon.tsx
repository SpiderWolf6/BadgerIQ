/**
 * ComingSoon — placeholder for seasons or tabs that don't have data yet.
 */

interface Props {
  title: string;     // e.g. "Fall 26 Reports"
  status?: string;   // headline under the title (default "Coming soon")
  detail?: string;   // optional second line
}

export default function ComingSoon({ title, status = "Coming soon", detail }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#c5050c" }} />
      <span className="font-display font-700 text-xl" style={{ color: "#e8e8ea", letterSpacing: "0.03em" }}>
        {title}
      </span>
      <span className="font-mono text-[12px] uppercase tracking-widest" style={{ color: "#555" }}>
        {status}
      </span>
      {detail && (
        <span className="font-mono text-[12px] max-w-sm" style={{ color: "#444" }}>
          {detail}
        </span>
      )}
    </div>
  );
}
