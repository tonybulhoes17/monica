import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, content_html, patient:patients(full_name)")
    .eq("id", examId)
    .single();

  if (!exam || !exam.content_html) {
    return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
  }

  const pdf = await renderExamPdf(
    examId,
    request.nextUrl.origin,
    request.headers.get("cookie"),
  );

  const fileName = `laudo-eeg-${exam.patient.full_name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
