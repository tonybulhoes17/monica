"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createInstitution(input: {
  name: string;
  address: string;
  logoUrl: string | null;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("institutions").insert({
    name: input.name,
    address: input.address || null,
    logo_url: input.logoUrl,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/instituicoes");
}

export async function updateInstitution(
  id: string,
  input: { name: string; address: string; logoUrl: string | null },
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("institutions")
    .update({
      name: input.name,
      address: input.address || null,
      logo_url: input.logoUrl,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/instituicoes");
  revalidatePath(`/admin/instituicoes/${id}`);
}

/**
 * Exclui a instituição. Não apaga os exames já vinculados a ela — a FK
 * `exams.institution_id` é "on delete set null" (ver migração 0011), então
 * esses exames só perdem a instituição associada, ficam "sem instituição".
 */
export async function deleteInstitution(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("institutions").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/instituicoes");
}
