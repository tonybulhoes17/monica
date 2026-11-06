import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditSecretaryForm } from "../edit-secretary-form";

export default async function EditSecretariaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "secretary")
    .single();

  if (!profile) notFound();

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Editar secretária
      </h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <EditSecretaryForm
          id={profile.id}
          fullName={profile.full_name}
          email={userData.user?.email ?? ""}
        />
      </div>
    </div>
  );
}
