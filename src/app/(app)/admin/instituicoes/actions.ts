"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createInstitution(input: {
  name: string;
  logoUrl: string | null;
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("institutions").insert({
    name: input.name,
    logo_url: input.logoUrl,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/instituicoes");
}
