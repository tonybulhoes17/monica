import clsx from "clsx";
import type { ExamStatus } from "@/lib/database.types";

const LABELS: Record<ExamStatus, string> = {
  pending: "Pendente",
  draft: "Em edição",
  signed: "Assinado",
};

const STYLES: Record<ExamStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  draft: "bg-blue-100 text-blue-800",
  signed: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: ExamStatus }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
