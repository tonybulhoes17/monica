import { requireAdmin } from "@/lib/auth";
import { TemplateForm } from "../template-form";

export default async function NovoModeloPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Novo modelo de laudo</h1>
      <TemplateForm />
    </div>
  );
}
