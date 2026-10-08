import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatAge } from "@/lib/age";
import { DashboardFilters } from "./dashboard-filters";
import { ALL_DATES } from "./constants";
import { StatusBadge } from "@/components/status-badge";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; name?: string; institution?: string }>;
}) {
  const profile = await requireProfile();
  const { date, name, institution } = await searchParams;
  const selectedDate = date ?? todayIso();
  const nameFilter = name ?? "";
  const institutionFilter = institution ?? "";

  const supabase = await createClient();
  const { data: institutions } = await supabase
    .from("institutions")
    .select("*")
    .order("name");

  let query = supabase
    .from("exams")
    .select("*, patient:patients!inner(*), institution:institutions(*)")
    .order("exam_date", { ascending: false })
    .order("created_at", { ascending: true });

  if (selectedDate !== ALL_DATES) {
    query = query.eq("exam_date", selectedDate);
  }
  if (nameFilter) {
    query = query.ilike("patient.full_name", `%${nameFilter}%`);
  }
  if (institutionFilter) {
    query = query.eq("institution_id", institutionFilter);
  }

  const { data: exams } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Eletros do dia
        </h1>
        <DashboardFilters
          selectedDate={selectedDate}
          name={nameFilter}
          institutionId={institutionFilter}
          institutions={institutions ?? []}
        />
      </div>

      {!exams || exams.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum exame encontrado para esses filtros.
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
                  {selectedDate === ALL_DATES && (
                    <>{exam.exam_date.split("-").reverse().join("/")} · </>
                  )}
                  {formatAge(exam.patient.birth_date, exam.exam_date)}
                  {" · "}Solicitante: {exam.requesting_doctor}
                  {exam.institution && <> · {exam.institution.name}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={exam.status} />
                <Link
                  href={`/pacientes/${exam.id}/editar`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Editar ficha
                </Link>
                {profile.role === "admin" && (
                  <Link
                    href={`/laudos/${exam.id}`}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    {exam.status === "signed" ? "Ver laudo" : "Fazer laudo"}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
