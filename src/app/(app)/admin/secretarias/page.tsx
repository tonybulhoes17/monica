import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewSecretaryForm } from "./new-secretary-form";
import { DeleteSecretaryButton } from "./delete-secretary-button";

export default async function SecretariasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: secretaries } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "secretary")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Secretárias</h1>

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {secretaries && secretaries.length > 0 ? (
          secretaries.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-800"
            >
              <span>{s.full_name}</span>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/secretarias/${s.id}`}
                  className="text-sm text-slate-600 hover:underline"
                >
                  Editar
                </Link>
                <DeleteSecretaryButton id={s.id} fullName={s.full_name} />
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-slate-500">
            Nenhuma secretária cadastrada ainda.
          </li>
        )}
      </ul>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Nova secretária
        </h2>
        <NewSecretaryForm />
      </div>
    </div>
  );
}
