import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LaudoShell } from "@/components/laudo-shell";
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
    .select("*, patient:patients(*)")
    .eq("id", examId)
    .single();

  if (!exam || !exam.content_html) notFound();

  return (
    <>
      <AutoPrint />
      <LaudoShell
        patient={exam.patient}
        exam={exam}
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
