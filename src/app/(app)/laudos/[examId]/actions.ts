"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeTemplatePlaceholders } from "@/lib/template";
import { normalizeEmptyParagraphs } from "@/lib/content-html";
import { renderExamPdf } from "@/lib/pdf";
import { signExamPdf, VidasReauthorizationRequiredError } from "@/lib/signing/vidas";

const MAX_PDF_BYTES = 7 * 1024 * 1024; // limite do Vidas (manual §3.2)

async function getAppBaseUrl(): Promise<string> {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? "http"
    : "https";
  return `${protocol}://${host}`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

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
  await requireAdmin();
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

/**
 * Corrige a instituição (local do exame) atribuída a um laudo — a
 * secretária pode ter selecionado o local errado no lançamento. Bloqueado
 * para laudos já assinados (a logo da instituição já está impressa no PDF
 * assinado; corrigir ali exigiria reabrir o laudo primeiro).
 */
export async function updateExamInstitution(
  examId: string,
  institutionId: string | null,
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("status")
    .eq("id", examId)
    .single();
  if (!exam) throw new Error("Exame não encontrado.");
  if (exam.status === "signed") {
    throw new Error(
      "Este laudo já está assinado. Reabra para edição antes de trocar a instituição.",
    );
  }

  const { error } = await supabase
    .from("exams")
    .update({ institution_id: institutionId, updated_at: new Date().toISOString() })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

/**
 * Corrige o médico solicitante direto na tela de "Fazer laudo" — sem
 * precisar passar por "Editar ficha". Bloqueado para laudos já assinados
 * (o nome já está impresso no PDF assinado).
 */
export async function updateExamRequestingDoctor(
  examId: string,
  requestingDoctor: string,
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("status")
    .eq("id", examId)
    .single();
  if (!exam) throw new Error("Exame não encontrado.");
  if (exam.status === "signed") {
    throw new Error(
      "Este laudo já está assinado. Reabra para edição antes de trocar o solicitante.",
    );
  }

  const { error } = await supabase
    .from("exams")
    .update({ requesting_doctor: requestingDoctor, updated_at: new Date().toISOString() })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

export async function saveLaudoContent(examId: string, contentHtml: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exams")
    .update({
      content_html: normalizeEmptyParagraphs(contentHtml),
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

/**
 * Reabre para edição um laudo já assinado: perde a assinatura (não guardamos
 * histórico de versões, apenas a versão atual) e volta o status para "draft".
 */
export async function revertToDraft(examId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exams")
    .update({
      status: "draft",
      signed_at: null,
      signed_by: null,
      signature_payload: null,
      signed_pdf_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}

/**
 * Transforma o laudo atual (como está neste exame) em um novo modelo padrão,
 * reutilizável para outros pacientes — "qualquer laudo pode virar um tipo
 * novo de modelo, basta dar um nome".
 */
export async function saveExamAsTemplate(examId: string, name: string) {
  await requireAdmin();
  const supabase = await createClient();

  const exam = await loadExamWithPatient(examId);
  if (!exam) throw new Error("Exame não encontrado.");
  if (!exam.content_html) throw new Error("O laudo ainda não tem conteúdo.");

  const { error } = await supabase.from("report_templates").insert({
    name,
    content_html: exam.content_html,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/modelos");
}

export async function signLaudo(examId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const exam = await loadExamWithPatient(examId);
  if (!exam) throw new Error("Exame não encontrado.");
  if (!exam.content_html) throw new Error("O laudo ainda não tem conteúdo.");

  // Calculado ANTES de renderizar: o PDF que vai pro Vidas (e depois vira
  // o documento assinado oficial) precisa já mostrar o selo de assinatura
  // com esse horário — se renderizássemos antes e só definíssemos
  // signed_at depois (no update do banco), o PDF assinado ficaria com o
  // placeholder "não assinado" pra sempre, mesmo com a assinatura
  // criptográfica válida por dentro (bug real encontrado: ao reassinar um
  // laudo editado, o "Baixar PDF" parava de mostrar o selo, enquanto
  // "Imprimir" — que renderiza ao vivo a partir do banco já atualizado —
  // continuava mostrando certo).
  const signedAt = new Date().toISOString();

  const baseUrl = await getAppBaseUrl();
  const cookieHeader = await getCookieHeader();
  const pdfBuffer = await renderExamPdf(examId, baseUrl, cookieHeader, {
    previewSignedAt: signedAt,
  });

  if (pdfBuffer.length > MAX_PDF_BYTES) {
    throw new Error(
      "O laudo gerado excede 7MB, limite aceito pelo Vidas para assinatura. Reduza imagens/conteúdo e tente novamente.",
    );
  }

  let signResult;
  try {
    signResult = await signExamPdf({
      profileId: admin.id,
      pdfBuffer,
      examId,
      alias: `laudo-eeg-${exam.patient.full_name}`,
      signedAt,
    });
  } catch (err) {
    if (err instanceof VidasReauthorizationRequiredError) {
      redirect(
        `/api/vidas/authorize?returnTo=${encodeURIComponent(`/laudos/${examId}/editar`)}`,
      );
    }
    throw err;
  }

  let signedPdfPath: string | null = null;
  if (signResult.signedPdf) {
    const adminClient = createAdminClient();
    const path = `${examId}-${Date.now()}.pdf`;
    const { error: uploadError } = await adminClient.storage
      .from("signed-laudos")
      .upload(path, signResult.signedPdf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);
    signedPdfPath = path;
  }

  const { error } = await supabase
    .from("exams")
    .update({
      status: "signed",
      signed_at: signResult.signedAt,
      signed_by: admin.id,
      signature_payload: {
        provider: signResult.provider,
        signedAt: signResult.signedAt,
        certificateAlias: signResult.certificateAlias,
      },
      signed_pdf_path: signedPdfPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId);

  if (error) throw new Error(error.message);
  revalidatePath(`/laudos/${examId}/editar`);
}
