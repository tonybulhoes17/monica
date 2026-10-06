import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ModelosPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("report_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Modelos de laudo
        </h1>
        <Link
          href="/admin/modelos/novo"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo modelo
        </Link>
      </div>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {templates && templates.length > 0 ? (
          templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">
                  {t.is_active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <Link
                href={`/admin/modelos/${t.id}`}
                className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
              >
                Editar
              </Link>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Nenhum modelo cadastrado ainda. Crie o primeiro modelo com o texto
            padrão de laudo da Dra. Monica.
          </li>
        )}
      </ul>
    </div>
  );
}
