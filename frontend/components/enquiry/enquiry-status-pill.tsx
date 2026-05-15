import { enquiryStatusLabel } from "@/lib/enquiryConstants";

export function EnquiryStatusPill({ status }: { status: string }) {
  const base =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize";
  const map: Record<string, string> = {
    new: "bg-blue-500/15 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
    contacted:
      "bg-violet-500/15 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
    in_discussion:
      "bg-indigo-500/15 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
    quoted:
      "bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200",
    negotiation:
      "bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    won: "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
    lost: "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-red-200",
    dropped:
      "bg-muted text-muted-foreground border border-border",
  };
  const cls = map[status] ?? map.dropped;
  return (
    <span className={`${base} ${cls}`}>{enquiryStatusLabel(status)}</span>
  );
}
