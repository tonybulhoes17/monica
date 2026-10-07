"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { formatAge } from "@/lib/age";
import type { Institution } from "@/lib/database.types";
import {
  createPatientExam,
  lookupPatientByCpf,
  type PatientLookupResult,
} from "./actions";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PatientExamForm({
  institutions,
}: {
  institutions: Institution[];
}) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [examDate, setExamDate] = useState(todayIso());
  const [requestingDoctor, setRequestingDoctor] = useState("");
  const [comorbidities, setComorbidities] = useState("");
  const [medications, setMedications] = useState("");
  const [institutionId, setInstitutionId] = useState(
    institutions[0]?.id ?? "",
  );

  const [lookup, setLookup] = useState<PatientLookupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      const digits = onlyDigits(cpf);
      if (digits.length !== 11) {
        setLookup(null);
        return;
      }
      const result = await lookupPatientByCpf(digits);
      setLookup(result);
      if (result) {
        setFullName(result.patient.full_name);
        setBirthDate(result.patient.birth_date);
      }
    }, 400);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [cpf]);

  const ageLabel =
    birthDate && examDate ? formatAge(birthDate, examDate) : null;

  const MIN_BIRTH_DATE = "1900-01-01";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      const { examId } = await createPatientExam({
        fullName,
        cpf,
        birthDate,
        examDate,
        requestingDoctor,
        comorbidities,
        medications,
        institutionId: institutionId || null,
      });
      router.push(`/laudos/${examId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
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
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {lookup && (
          <p className="mt-1 text-xs text-emerald-700">
            Paciente já cadastrado — dados preenchidos automaticamente.
            {lookup.previousExams.length > 0 && (
              <> {lookup.previousExams.length} exame(s) anterior(es) registrado(s).</>
            )}
          </p>
        )}
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
            required
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

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Salvando..." : "Lançar exame"}
      </button>
    </form>
  );
}
