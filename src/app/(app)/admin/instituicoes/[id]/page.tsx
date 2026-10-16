import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InstitutionForm } from "../institution-form";

export default async function EditarInstituicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!institution) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Editar instituição: {institution.name}
      </h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <InstitutionForm institution={institution} />
      </div>
    </div>
  );
}
