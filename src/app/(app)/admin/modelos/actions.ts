"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createTemplate(input: {
  name: string;
  contentHtml: string;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_templates")
    .insert({ name: input.name, content_html: input.contentHtml })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Falha ao criar modelo.");

  revalidatePath("/admin/modelos");
  redirect(`/admin/modelos/${data.id}`);
}

export async function updateTemplate(
  id: string,
  input: { name: string; contentHtml: string; isActive: boolean },
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_templates")
    .update({
      name: input.name,
      content_html: input.contentHtml,
      is_active: input.isActive,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/modelos");
  revalidatePath(`/admin/modelos/${id}`);
}
