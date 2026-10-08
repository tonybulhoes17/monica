"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { onlyDigits } from "@/lib/cpf";
import type { Exam, Patient } from "@/lib/database.types";

export interface PatientLookupResult {
  patient: Patient;
  previousExams: Pick<Exam, "id" | "exam_date" | "status">[];
}

export async function lookupPatientByCpf(
  cpf: string,
): Promise<PatientLookupResult | null> {
  await requireProfile();
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return null;

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("cpf", digits)
    .maybeSingle();

  if (!patient) return null;

  const { data: previousExams } = await supabase
    .from("exams")
    .select("id, exam_date, status")
    .eq("patient_id", patient.id)
    .order("exam_date", { ascending: false });

  return { patient, previousExams: previousExams ?? [] };
}

export interface CreatePatientExamInput {
  fullName: string;
  cpf: string;
  birthDate: string;
  examDate: string;
  requestingDoctor: string;
  comorbidities: string;
  medications: string;
  institutionId: string | null;
}

export async function createPatientExam(
  input: CreatePatientExamInput,
): Promise<{ examId: string }> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const cpfDigits = onlyDigits(input.cpf);

  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("cpf", cpfDigits)
    .maybeSingle();

  let patientId = existingPatient?.id;

  if (patientId) {
    await supabase
      .from("patients")
      .update({
        full_name: input.fullName,
        birth_date: input.birthDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);
  } else {
    const { data: newPatient, error } = await supabase
      .from("patients")
      .insert({
        full_name: input.fullName,
        cpf: cpfDigits,
        birth_date: input.birthDate,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (error || !newPatient) {
      throw new Error(error?.message ?? "Falha ao cadastrar paciente.");
    }
    patientId = newPatient.id;
  }

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      patient_id: patientId,
      exam_date: input.examDate,
      requesting_doctor: input.requestingDoctor,
      comorbidities: input.comorbidities || null,
      medications: input.medications || null,
      institution_id: input.institutionId,
      status: "pending",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (examError || !exam) {
    throw new Error(examError?.message ?? "Falha ao lançar exame.");
  }

  return { examId: exam.id };
}

export interface UpdatePatientExamInput {
  examId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  examDate: string;
  requestingDoctor: string;
  comorbidities: string;
  medications: string;
  institutionId: string | null;
}

/**
 * Edita os dados de intake (ficha) de um exame já lançado — usado para
 * corrigir erros de digitação da secretária. Bloqueado para exames já
 * assinados: o laudo assinado não guarda histórico de versões, então mudar
 * dados impressos (nome, datas, instituição) depois de assinado deixaria a
 * tela e o PDF já assinado divergentes.
 */
export async function updatePatientExam(
  input: UpdatePatientExamInput,
): Promise<void> {
  await requireProfile();
  const supabase = await createClient();
  const cpfDigits = onlyDigits(input.cpf);

  const { data: exam } = await supabase
    .from("exams")
    .select("id, patient_id, status")
    .eq("id", input.examId)
    .single();
  if (!exam) throw new Error("Exame não encontrado.");
  if (exam.status === "signed") {
    throw new Error(
      "Este exame já está assinado. Peça para reabrir o laudo para edição antes de corrigir a ficha.",
    );
  }

  const { data: cpfOwner } = await supabase
    .from("patients")
    .select("id")
    .eq("cpf", cpfDigits)
    .maybeSingle();
  if (cpfOwner && cpfOwner.id !== exam.patient_id) {
    throw new Error("Esse CPF já pertence a outro paciente cadastrado.");
  }

  const { error: patientError } = await supabase
    .from("patients")
    .update({
      full_name: input.fullName,
      cpf: cpfDigits,
      birth_date: input.birthDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", exam.patient_id);
  if (patientError) throw new Error(patientError.message);

  const { error: examError } = await supabase
    .from("exams")
    .update({
      exam_date: input.examDate,
      requesting_doctor: input.requestingDoctor,
      comorbidities: input.comorbidities || null,
      medications: input.medications || null,
      institution_id: input.institutionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.examId);
  if (examError) throw new Error(examError.message);

  revalidatePath("/dashboard");
  revalidatePath(`/laudos/${input.examId}`);
  revalidatePath(`/laudos/${input.examId}/editar`);
}
