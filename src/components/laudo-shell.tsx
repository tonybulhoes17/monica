import type { Exam, Patient } from "@/lib/database.types";
import { calculateAge } from "@/lib/age";

function formatDateBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

interface LaudoShellProps {
  patient: Patient;
  exam: Exam;
  body: React.ReactNode;
}

const DOCTOR_NAME = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Dra. Monica Seixas";
// TODO: substituir pelo CRM/RQE reais e pelas imagens de logo/carimbo/assinatura
// quando a Dra. Monica enviar esses dados e arquivos.
const DOCTOR_CRM = process.env.NEXT_PUBLIC_DOCTOR_CRM ?? "CRM a definir";

export function LaudoShell({ patient, exam, body }: LaudoShellProps) {
  const isSigned = exam.status === "signed";
  const signature = exam.signature_payload as
    | { provider?: string; signedAt?: string; certificateId?: string }
    | null;

  return (
    <div className="laudo-page mx-auto w-full max-w-[210mm] rounded-md border border-slate-200 p-10 shadow-sm print:border-0 print:shadow-none">
      <header className="mb-6 flex items-center justify-between border-b border-slate-300 pb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400">
          Logo
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">{DOCTOR_NAME}</p>
          <p className="text-xs text-slate-500">Eletroencefalografia</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-800">
        <p>
          <span className="font-medium">Paciente:</span> {patient.full_name}
        </p>
        <p>
          <span className="font-medium">Idade:</span>{" "}
          {calculateAge(patient.birth_date, exam.exam_date)} anos
        </p>
        <p>
          <span className="font-medium">Data de nascimento:</span>{" "}
          {formatDateBr(patient.birth_date)}
        </p>
        <p>
          <span className="font-medium">Data do exame:</span>{" "}
          {formatDateBr(exam.exam_date)}
        </p>
        <p>
          <span className="font-medium">Médico solicitante:</span>{" "}
          {exam.requesting_doctor}
        </p>
        <p>
          <span className="font-medium">Comorbidades:</span>{" "}
          {exam.comorbidities || "Nenhuma relatada"}
        </p>
        <p className="col-span-2">
          <span className="font-medium">Medicações de uso regular:</span>{" "}
          {exam.medications || "Nenhuma relatada"}
        </p>
      </section>

      <section className="min-h-[200px] border-t border-slate-200 pt-4">
        {body}
      </section>

      <footer className="mt-16 flex items-end justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
        <div className="flex h-20 w-48 flex-col items-center justify-center rounded border border-dashed border-slate-300 text-center">
          {isSigned ? (
            <>
              <span className="font-medium text-slate-700">
                Assinado digitalmente via Vidas
              </span>
              {signature?.signedAt && (
                <span>{new Date(signature.signedAt).toLocaleString("pt-BR")}</span>
              )}
              {signature?.provider === "simulated" && (
                <span className="text-amber-600">(assinatura simulada)</span>
              )}
            </>
          ) : (
            "Assinatura digital (Vidas)"
          )}
        </div>
        <div className="flex h-20 w-48 flex-col items-center justify-center rounded border border-dashed border-slate-300 text-center">
          <span className="font-medium text-slate-700">{DOCTOR_NAME}</span>
          <span>{DOCTOR_CRM}</span>
        </div>
      </footer>
    </div>
  );
}
