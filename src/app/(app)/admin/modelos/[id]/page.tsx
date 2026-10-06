import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "../template-form";

export default async function EditarModeloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Editar modelo: {template.name}
      </h1>
      <TemplateForm template={template} />
    </div>
  );
}
