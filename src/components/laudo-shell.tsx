import Image from "next/image";
import type { ExamWithPatient } from "@/lib/database.types";
import { calculateAge } from "@/lib/age";

function formatDateBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

interface LaudoShellProps {
  exam: ExamWithPatient;
  body: React.ReactNode;
}

const DOCTOR_NAME = "Dra. Mônica Seixas";
const DOCTOR_SPECIALTY = "Neurologista|Neurofisiologia Clínica";
// TODO: ajustar se o carimbo oficial trouxer um texto diferente de CRM/RQE.
const DOCTOR_REGISTRATION =
  process.env.NEXT_PUBLIC_DOCTOR_CRM ?? "CRMBA 28539 RQE 19407";

// Texto fixo do serviço, igual em todos os laudos independente da
// instituição (só a logo do cabeçalho muda conforme o local do exame).
const SERVICE_LINES = [
  "NEUROFISIOLOGIA CLÍNICA",
  "ELETROENCEFALOGRAMA DIGITAL (EEG)",
  "VÍDEO- ELETROENCEFALOGRAMA (VÍDEO-EEG)",
];

export function LaudoShell({ exam, body }: LaudoShellProps) {
  const { patient, institution } = exam;
  const isSigned = exam.status === "signed";
  const signature = exam.signature_payload as
    | { provider?: string; signedAt?: string; certificateId?: string }
    | null;
  const logoUrl = institution?.logo_url || "/branding/logo.png";

  return (
    <div className="laudo-page mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col border border-slate-200 p-10 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="mb-6 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <Image
            src={logoUrl}
            alt={institution?.name ?? "Logo"}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="text-sm font-bold leading-tight text-slate-900">
          {SERVICE_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <section className="laudo-patient-box mb-6 grid grid-cols-2 gap-x-6 gap-y-1 rounded-sm border-[1.5px] border-[#1f3a63] px-4 py-3 text-sm text-slate-900">
        <p>
          <span className="font-bold">Nome</span>: {patient.full_name}
        </p>
        <p>
          <span className="font-bold">Data do exame:</span>{" "}
          {formatDateBr(exam.exam_date)}
        </p>
        <p>
          <span className="font-bold">Data de Nascimento:</span>{" "}
          {formatDateBr(patient.birth_date)}
        </p>
        <p>
          <span className="font-bold">Idade:</span>{" "}
          {calculateAge(patient.birth_date, exam.exam_date)} anos
        </p>
        <p className="col-span-2">
          <span className="font-bold">Solicitante</span>: {exam.requesting_doctor}
        </p>
      </section>

      <section className="no-print mb-4 rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <span className="font-semibold">
          Referência para a Dra. Monica (não entra no laudo impresso):
        </span>{" "}
        Comorbidades: {exam.comorbidities || "nenhuma relatada"} · Medicações:{" "}
        {exam.medications || "nenhuma relatada"}
      </section>

      <section className="flex-1">{body}</section>

      <footer className="mt-10 flex items-end justify-between text-xs text-slate-700">
        <div className="w-56">
          {isSigned ? (
            <div className="text-center">
              <p className="font-medium">Assinado digitalmente via Vidas</p>
              {signature?.signedAt && (
                <p>{new Date(signature.signedAt).toLocaleString("pt-BR")}</p>
              )}
              {signature?.provider === "simulated" && (
                <p className="text-amber-600">(assinatura simulada)</p>
              )}
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center rounded border border-dashed border-slate-300 text-center text-slate-400">
              Assinatura digital (Vidas)
            </div>
          )}
        </div>

        <div className="w-56 text-center">
          <div className="relative mx-auto mb-1 h-16 w-40">
            <Image
              src="/branding/assinatura.jpg"
              alt="Assinatura"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="border-t border-slate-400 pt-1 font-medium">
            {DOCTOR_NAME}
          </p>
          <p>{DOCTOR_SPECIALTY}</p>
          <p>{DOCTOR_REGISTRATION}</p>
        </div>
      </footer>
    </div>
  );
}
