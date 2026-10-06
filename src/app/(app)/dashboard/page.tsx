import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/age";
import { DateSelector } from "./date-selector";
import { StatusBadge } from "@/components/status-badge";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selectedDate = date ?? todayIso();

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("*, patient:patients(*)")
    .eq("exam_date", selectedDate)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Eletros do dia
        </h1>
        <DateSelector selectedDate={selectedDate} />
      </div>

      {!exams || exams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum exame lançado para esta data.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {exam.patient.full_name}
                </p>
                <p className="text-xs text-slate-500">
                  {calculateAge(exam.patient.birth_date, exam.exam_date)} anos
                  {" · "}Solicitante: {exam.requesting_doctor}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={exam.status} />
                <Link
                  href={`/laudos/${exam.id}`}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  {exam.status === "signed" ? "Ver laudo" : "Fazer laudo"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
