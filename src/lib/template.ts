import { formatAge } from "@/lib/age";
import type { Exam, Patient } from "@/lib/database.types";

function formatDateBr(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function mergeTemplatePlaceholders(
  templateHtml: string,
  patient: Patient,
  exam: Pick<
    Exam,
    "exam_date" | "requesting_doctor" | "comorbidities" | "medications"
  >,
): string {
  const replacements: Record<string, string> = {
    "{{nome_paciente}}": patient.full_name,
    "{{idade}}": formatAge(patient.birth_date, exam.exam_date),
    "{{data_nascimento}}": formatDateBr(patient.birth_date),
    "{{data_exame}}": formatDateBr(exam.exam_date),
    "{{medico_solicitante}}": exam.requesting_doctor,
    "{{comorbidades}}": exam.comorbidities || "Nenhuma relatada",
    "{{medicacoes}}": exam.medications || "Nenhuma relatada",
  };

  return Object.entries(replacements).reduce(
    (html, [placeholder, value]) => html.split(placeholder).join(value),
    templateHtml,
  );
}
