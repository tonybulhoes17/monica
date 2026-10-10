import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatAge } from "@/lib/age";
import { DashboardFilters } from "./dashboard-filters";
import { ALL_DATES, STATUS_PENDING } from "./constants";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    name?: string;
    institution?: string;
    status?: string;
  }>;
}) {
  const profile = await requireProfile();
  const { date, name, institution, status } = await searchParams;
  // Visão padrão (sem filtros na URL): data limpa + só laudos pendentes. O
  // usuário pode depois trocar qualquer filtro livremente.
  const selectedDate = date ?? ALL_DATES;
  const nameFilter = name ?? "";
  const institutionFilter = institution ?? "";
  const statusFilter = status ?? STATUS_PENDING;

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
  if (statusFilter === STATUS_PENDING) {
    query = query.neq("status", "signed");
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
        <h1 className="text-xl font-semibold text-slate-900">Eletros</h1>
        <DashboardFilters
          selectedDate={selectedDate}
          name={nameFilter}
          institutionId={institutionFilter}
          status={statusFilter}
          institutions={institutions ?? []}
        />
      </div>

      {!exams || exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum exame encontrado para esses filtros.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/60"
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
              <div className="flex items-center gap-2.5">
                <StatusBadge status={exam.status} />
                <Link
                  href={`/pacientes/${exam.id}/editar`}
                  className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  Editar ficha
                </Link>
                {profile.role === "admin" && (
                  <Link
                    href={`/laudos/${exam.id}`}
                    className="rounded-full bg-[#002060] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#001845] hover:shadow"
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
