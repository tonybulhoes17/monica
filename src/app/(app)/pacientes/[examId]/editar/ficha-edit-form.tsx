"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { formatAge } from "@/lib/age";
import type { Exam, Institution, Patient } from "@/lib/database.types";
import { updatePatientExam } from "../../novo/actions";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const MIN_BIRTH_DATE = "1900-01-01";

export function FichaEditForm({
  exam,
  institutions,
}: {
  exam: Exam & { patient: Patient };
  institutions: Institution[];
}) {
  const router = useRouter();
  const isSigned = exam.status === "signed";

  const [cpf, setCpf] = useState(exam.patient.cpf);
  const [fullName, setFullName] = useState(exam.patient.full_name);
  const [birthDate, setBirthDate] = useState(exam.patient.birth_date);
  const [examDate, setExamDate] = useState(exam.exam_date);
  const [requestingDoctor, setRequestingDoctor] = useState(
    exam.requesting_doctor,
  );
  const [comorbidities, setComorbidities] = useState(exam.comorbidities ?? "");
  const [medications, setMedications] = useState(exam.medications ?? "");
  const [institutionId, setInstitutionId] = useState(
    exam.institution_id ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const ageLabel =
    birthDate && examDate ? formatAge(birthDate, examDate) : null;

  if (isSigned) {
    return (
      <div className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
        <p>
          Este exame já está assinado. Para corrigir algum dado da ficha, peça
          para a Dra. Monica reabrir o laudo para edição primeiro (isso remove
          a assinatura atual).
        </p>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="font-medium">Nome</dt>
            <dd>{exam.patient.full_name}</dd>
          </div>
          <div>
            <dt className="font-medium">CPF</dt>
            <dd>{formatCpf(exam.patient.cpf)}</dd>
          </div>
          <div>
            <dt className="font-medium">Data de nascimento</dt>
            <dd>{exam.patient.birth_date.split("-").reverse().join("/")}</dd>
          </div>
          <div>
            <dt className="font-medium">Data do exame</dt>
            <dd>{exam.exam_date.split("-").reverse().join("/")}</dd>
          </div>
          <div>
            <dt className="font-medium">Solicitante</dt>
            <dd>{exam.requesting_doctor}</dd>
          </div>
        </dl>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!isValidCpf(cpf)) {
      setError("CPF inválido.");
      return;
    }
    if (birthDate < MIN_BIRTH_DATE || birthDate > examDate) {
      setError(
        "Data de nascimento inválida: precisa ser uma data real, anterior à data do exame.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await updatePatientExam({
        examId: exam.id,
        fullName,
        cpf,
        birthDate,
        examDate,
        requestingDoctor,
        comorbidities,
        medications,
        institutionId: institutionId || null,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">CPF</label>
        <input
          required
          value={formatCpf(cpf)}
          onChange={(e) => setCpf(onlyDigits(e.target.value))}
          placeholder="000.000.000-00"
          className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nome completo
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data de nascimento
          </label>
          <input
            required
            type="date"
            value={birthDate}
            min={MIN_BIRTH_DATE}
            max={examDate || todayIso()}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Data do exame
          </label>
          <input
            required
            type="date"
            value={examDate}
            min={MIN_BIRTH_DATE}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Idade (calculada)
          </label>
          <input
            disabled
            value={ageLabel ?? ""}
            className="mt-1 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Instituição (local do exame)
          </label>
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {institutions.length === 0 && (
              <option value="">Nenhuma instituição cadastrada</option>
            )}
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Médico solicitante
          </label>
          <input
            required
            value={requestingDoctor}
            onChange={(e) => setRequestingDoctor(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Comorbidades conhecidas
          </label>
          <textarea
            value={comorbidities}
            onChange={(e) => setComorbidities(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Medicações de uso regular
          </label>
          <textarea
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-emerald-600">Ficha atualizada com sucesso.</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
