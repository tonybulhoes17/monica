import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaudoShell } from "@/components/laudo-shell";
import { generateQrDataUrl } from "@/lib/qrcode";
import { AutoPrint } from "./auto-print";

export default async function ImprimirLaudoPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
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

  return (
    <>
      <AutoPrint />
      <LaudoShell
        exam={exam}
        qrCodeDataUrl={qrCodeDataUrl}
        body={
          <div
            className="laudo-prose"
            dangerouslySetInnerHTML={{ __html: exam.content_html }}
          />
        }
      />
    </>
  );
}
