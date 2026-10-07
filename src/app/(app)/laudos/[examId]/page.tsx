import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatAge } from "@/lib/age";
import { TemplatePicker } from "./template-picker";

export default async function LaudoPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  await requireAdmin();
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*)")
    .eq("id", examId)
    .single();

  if (!exam) notFound();

  if (exam.content_html) {
    redirect(`/laudos/${examId}/editar`);
  }

  const { data: templates } = await supabase
    .from("report_templates")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {exam.patient.full_name}
        </h1>
        <p className="text-sm text-slate-500">
          {formatAge(exam.patient.birth_date, exam.exam_date)} ·
          Exame em {exam.exam_date.split("-").reverse().join("/")}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Escolha o modelo de laudo
        </h2>
        {templates && templates.length > 0 ? (
          <TemplatePicker examId={examId} templates={templates} />
        ) : (
          <p className="text-sm text-slate-500">
            Nenhum modelo de laudo cadastrado ainda. Cadastre um em{" "}
            <span className="font-medium">Modelos de laudo</span> antes de
            iniciar.
          </p>
        )}
      </div>
    </div>
  );
}
