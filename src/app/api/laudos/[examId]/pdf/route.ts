import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderExamPdf } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  await requireProfile();
  const { examId } = await params;

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("id, content_html, signed_pdf_path, patient:patients(full_name)")
    .eq("id", examId)
    .single();

  if (!exam || !exam.content_html) {
    return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
  }

  let pdf: Buffer;

  if (exam.signed_pdf_path) {
    // Laudo assinado pelo Vidas: serve exatamente os bytes assinados
    // (PAdES), não uma reconstrução em HTML — esse é o documento oficial.
    const adminClient = createAdminClient();
    const { data: signedFile, error: downloadError } = await adminClient.storage
      .from("signed-laudos")
      .download(exam.signed_pdf_path);

    if (downloadError || !signedFile) {
      return NextResponse.json(
        { error: "Falha ao recuperar o PDF assinado." },
        { status: 500 },
      );
    }
    pdf = Buffer.from(await signedFile.arrayBuffer());
  } else {
    pdf = await renderExamPdf(
      examId,
      request.nextUrl.origin,
      request.headers.get("cookie"),
    );
  }

  const fileName = `laudo-eeg-${exam.patient.full_name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}.pdf`;

  // ?inline=1 (usado pelo botão "Imprimir") abre o PDF no visualizador do
  // navegador em vez de forçar o download — o botão de imprimir do próprio
  // visualizador já manda o PDF certinho (com o cabeçalho repetido em toda
  // página) pra impressora, sem precisar de uma rota HTML separada.
  const inline = request.nextUrl.searchParams.get("inline") === "1";

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fileName}"`,
    },
  });
}
