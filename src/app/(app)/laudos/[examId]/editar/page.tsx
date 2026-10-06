import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LaudoEditor } from "./laudo-editor";

export default async function EditarLaudoPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const profile = await requireProfile();
  const { examId } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, patient:patients(*)")
    .eq("id", examId)
    .single();

  if (!exam) notFound();
  if (!exam.content_html) redirect(`/laudos/${examId}`);

  return <LaudoEditor exam={exam} profile={profile} />;
}
