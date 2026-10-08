import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FichaEditForm } from "./ficha-edit-form";

export default async function EditarFichaPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  await requireProfile();
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*)")
    .eq("id", examId)
    .single();

  if (!exam) notFound();

  const { data: institutions } = await supabase
    .from("institutions")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Editar ficha — {exam.patient.full_name}
      </h1>
      <FichaEditForm exam={exam} institutions={institutions ?? []} />
    </div>
  );
}
