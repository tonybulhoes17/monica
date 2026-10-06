"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mergeTemplatePlaceholders } from "@/lib/template";
import { signDocument } from "@/lib/signing/vidas";

async function loadExamWithPatient(examId: string) {
  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*)")
    .eq("id", examId)
    .single();
  return exam;
}

export async function startLaudoWithTemplate(
  examId: string,
  templateId: string,
) {
  await requireProfile();
  const supabase = await createClient();

  const exam = await loadExamWithPatient(examId);
  if (!exam) throw new Error("Exame não encontrado.");

  const { data: template } = await supabase
    .from("report_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!template) throw new Error("Modelo não encontrado.");

  const contentHtml = mergeTemplatePlaceholders(
    template.content_html,
    exam.patient,
    exam,
  );

  const { error } = await supabase
    .from("exams")
    .update({
      template_id: templateId,
      content_html: contentHtml,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);

  revalidatePath(`/laudos/${examId}`);
  redirect(`/laudos/${examId}/editar`);
}

export async function saveLaudoContent(examId: string, contentHtml: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exams")
    .update({ content_html: contentHtml, updated_at: new Date().toISOString() })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

/**
 * Reabre para edição um laudo já assinado: perde a assinatura (não guardamos
 * histórico de versões, apenas a versão atual) e volta o status para "draft".
 */
export async function revertToDraft(examId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exams")
    .update({
      status: "draft",
      signed_at: null,
      signed_by: null,
      signature_payload: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

export async function signLaudo(examId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const exam = await loadExamWithPatient(examId);
  if (!exam) throw new Error("Exame não encontrado.");
  if (!exam.content_html) throw new Error("O laudo ainda não tem conteúdo.");

  const signature = await signDocument({
    examId,
    signerName: admin.full_name,
    signerCrm: admin.crm,
  });

  const { error } = await supabase
    .from("exams")
    .update({
      status: "signed",
      signed_at: signature.signedAt,
      signed_by: admin.id,
      signature_payload: { ...signature },
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}
