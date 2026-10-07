import { createClient } from "@/lib/supabase/server";
import { PatientExamForm } from "./patient-exam-form";

export default async function NovoPacientePage() {
  const supabase = await createClient();
  const { data: institutions } = await supabase
    .from("institutions")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Lançar paciente / exame
      </h1>
      <PatientExamForm institutions={institutions ?? []} />
    </div>
  );
}
