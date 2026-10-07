import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewInstitutionForm } from "./new-institution-form";

export default async function InstituicoesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: institutions } = await supabase
    .from("institutions")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Instituições</h1>
      <p className="text-sm text-slate-500">
        A logo de cada instituição aparece no cabeçalho do laudo, conforme o
        local selecionado no cadastro do exame.
      </p>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {institutions && institutions.length > 0 ? (
          institutions.map((inst) => (
            <li key={inst.id} className="flex items-center gap-3 px-4 py-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-50">
                {inst.logo_url && (
                  <Image
                    src={inst.logo_url}
                    alt={inst.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>
              <span className="text-sm font-medium text-slate-900">
                {inst.name}
              </span>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Nenhuma instituição cadastrada.
          </li>
        )}
      </ul>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Nova instituição
        </h2>
        <NewInstitutionForm />
      </div>
    </div>
  );
}
