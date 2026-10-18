import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaudoShell, LaudoHeaderBlock } from "@/components/laudo-shell";
import { generateQrDataUrl } from "@/lib/qrcode";
import {
  normalizeEmptyParagraphs,
  splitLeadingHeading,
  splitOnPageBreaks,
} from "@/lib/content-html";
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

  // Normaliza parágrafos vazios (bug: <p></p> salvo pelo editor some na
  // impressão mesmo aparecendo normal durante a edição — ver
  // normalizeEmptyParagraphs). Feito aqui também (não só ao salvar) pra
  // consertar na hora laudos salvos antes dessa correção existir.
  const contentHtml = normalizeEmptyParagraphs(exam.content_html);

  // Laudos longos (ex. Vídeo-EEG) podem ter um marcador de quebra de página
  // no meio do texto — quando presente, repetimos o cabeçalho (logo + caixa
  // de dados + título) no início de cada trecho seguinte, igual à 1ª
  // página. Sem marcador, o conteúdo flui normalmente num só cabeçalho.
  const { title } = splitLeadingHeading(contentHtml);
  const [firstChunk, ...restChunks] = splitOnPageBreaks(contentHtml);

  return (
    <>
      <AutoPrint />
      <LaudoShell
        exam={exam}
        qrCodeDataUrl={qrCodeDataUrl}
        body={
          <>
            <div
              className="laudo-prose"
              dangerouslySetInnerHTML={{ __html: firstChunk }}
            />
            {restChunks.map((chunk, i) => (
              <div className="laudo-page-break" key={i}>
                <LaudoHeaderBlock exam={exam} />
                {title && (
                  <div className="laudo-prose">
                    <h1>{title}</h1>
                  </div>
                )}
                <div
                  className="laudo-prose"
                  dangerouslySetInnerHTML={{ __html: chunk }}
                />
              </div>
            ))}
          </>
        }
      />
    </>
  );
}
