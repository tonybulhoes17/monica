import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaudoShell } from "@/components/laudo-shell";
import { generateQrDataUrl } from "@/lib/qrcode";
import { normalizeEmptyParagraphs } from "@/lib/content-html";
import { AutoPrint } from "./auto-print";
import type { ExamWithPatient } from "@/lib/database.types";

export default async function ImprimirLaudoPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ previewSignedAt?: string }>;
}) {
  const { examId } = await params;
  const { previewSignedAt } = await searchParams;
  const supabase = await createClient();

  const { data: examRow } = await supabase
    .from("exams")
    .select("*, patient:patients(*), institution:institutions(*)")
    .eq("id", examId)
    .single();

  if (!examRow || !examRow.content_html) notFound();

  const alreadySigned =
    examRow.status === "signed" &&
    (examRow.signature_payload as { provider?: string } | null)?.provider === "vidas";

  // `previewSignedAt` é usado só internamente por signLaudo() (ver
  // src/app/(app)/laudos/[examId]/actions.ts): renderiza o laudo JÁ COM o
  // selo de assinatura antes de mandar pro Vidas assinar de verdade — sem
  // isso, o PDF que vira signed_pdf_path mostra o placeholder "não
  // assinado" pra sempre, porque é renderizado antes do status no banco
  // virar "signed". Só tem efeito se o exame ainda não estiver REALMENTE
  // assinado, pra nunca sobrescrever o selo de um documento já assinado.
  const isPreview = Boolean(previewSignedAt) && !alreadySigned;
  const exam: ExamWithPatient = isPreview
    ? {
        ...examRow,
        status: "signed",
        signature_payload: { provider: "vidas", signedAt: previewSignedAt },
      }
    : examRow;

  const isRealVidasSignature = alreadySigned || isPreview;
  const qrCodeDataUrl = isRealVidasSignature
    ? await generateQrDataUrl("https://validar.iti.gov.br")
    : null;

  // Normaliza parágrafos vazios (bug: <p></p> salvo pelo editor some na
  // impressão mesmo aparecendo normal durante a edição — ver
  // normalizeEmptyParagraphs). Feito aqui também (não só ao salvar) pra
  // consertar na hora laudos salvos antes dessa correção existir.
  const contentHtml = normalizeEmptyParagraphs(exam.content_html!);

  return (
    <>
      <AutoPrint />
      <LaudoShell
        exam={exam}
        qrCodeDataUrl={qrCodeDataUrl}
        repeatingHeader
        body={
          <div
            className="laudo-prose"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        }
      />
    </>
  );
}
