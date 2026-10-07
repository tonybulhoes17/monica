import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isVidasConfigured } from "@/lib/vidas/psc-client";
import { getActiveVidasSession } from "@/lib/vidas/session";
import { generateQrDataUrl } from "@/lib/qrcode";
import { LaudoEditor } from "./laudo-editor";

export default async function EditarLaudoPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const profile = await requireAdmin();
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*), institution:institutions(*)")
    .eq("id", examId)
    .single();

  if (!exam) notFound();
  if (!exam.content_html) redirect(`/laudos/${examId}`);

  const vidasConfigured = isVidasConfigured();
  const vidasSession = vidasConfigured
    ? await getActiveVidasSession(profile.id)
    : null;

  const isRealVidasSignature =
    exam.status === "signed" &&
    (exam.signature_payload as { provider?: string } | null)?.provider === "vidas";
  const qrCodeDataUrl = isRealVidasSignature
    ? await generateQrDataUrl("https://validar.iti.gov.br")
    : null;

  return (
    <LaudoEditor
      exam={exam}
      profile={profile}
      qrCodeDataUrl={qrCodeDataUrl}
      vidasStatus={{
        configured: vidasConfigured,
        connected: Boolean(vidasSession),
        expiresAt: vidasSession?.expiresAt.toISOString() ?? null,
      }}
    />
  );
}
