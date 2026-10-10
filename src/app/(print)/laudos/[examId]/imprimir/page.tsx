import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaudoShell } from "@/components/laudo-shell";
import { generateQrDataUrl } from "@/lib/qrcode";
import { splitLeadingHeading } from "@/lib/content-html";
import { AutoPrint } from "./auto-print";

export default async function ImprimirLaudoPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ pdf?: string }>;
}) {
  const { examId } = await params;
  const { pdf } = await searchParams;
  const isPdfRender = pdf === "1";
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*), institution:institutions(*)")
    .eq("id", examId)
    .single();

  if (!exam || !exam.content_html) notFound();

  const isRealVidasSignature =
    exam.status === "signed" &&
    (exam.signature_payload as { provider?: string } | null)?.provider === "vidas";
  const qrCodeDataUrl = isRealVidasSignature
    ? await generateQrDataUrl("https://validar.iti.gov.br")
    : null;

  // Na renderização para o Puppeteer (?pdf=1), o cabeçalho e o título já
  // são injetados em toda página via headerTemplate (ver src/lib/pdf.ts) —
  // omitimos os dois aqui pra não duplicar.
  const bodyHtml = isPdfRender
    ? splitLeadingHeading(exam.content_html).rest
    : exam.content_html;

  return (
    <>
      <AutoPrint />
      <LaudoShell
        exam={exam}
        qrCodeDataUrl={qrCodeDataUrl}
        hideHeader={isPdfRender}
        body={
          <div
            className="laudo-prose"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        }
      />
    </>
  );
}
