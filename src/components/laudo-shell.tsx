import Image from "next/image";
import type { ExamWithPatient } from "@/lib/database.types";
import { formatAge } from "@/lib/age";

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

const TIMES_NEW_ROMAN = '"Times New Roman", "Tinos", Times, serif';
const DARK_BLUE = "#002060";

export function LaudoShell({ exam, body }: LaudoShellProps) {
  const { patient, institution } = exam;
  const isSigned = exam.status === "signed";
  const signature = exam.signature_payload as
    | { provider?: string; signedAt?: string; certificateId?: string }
    | null;
  const logoUrl = institution?.logo_url || "/branding/logo.png";

  return (
    <div className="laudo-page mx-auto w-full max-w-[210mm] border border-slate-200 p-10 shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-end gap-4">
        <div
          className="relative shrink-0"
          style={{ width: "4.1cm", height: "2.1cm" }}
        >
          <Image
            src={logoUrl}
            alt={institution?.name ?? "Logo"}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <div
          className="leading-tight text-slate-900"
          style={{ fontFamily: TIMES_NEW_ROMAN, fontSize: "12pt", fontWeight: 700 }}
        >
          {SERVICE_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <section
        className="laudo-patient-box grid grid-cols-2 gap-x-6 gap-y-1 px-4 py-3 text-slate-900"
        style={{
          fontFamily: TIMES_NEW_ROMAN,
          fontSize: "12pt",
          fontWeight: 400,
          border: `2.25pt solid ${DARK_BLUE}`,
        }}
      >
        <p>
          <span className="font-bold">Nome</span>: {patient.full_name}
        </p>
        <p>
          <span className="font-bold">Data do exame</span>:{" "}
          {formatDateBr(exam.exam_date)}
        </p>
        <p>
          <span className="font-bold">Data de Nascimento</span>:{" "}
          {formatDateBr(patient.birth_date)}
        </p>
        <p>
          <span className="font-bold">Idade</span>:{" "}
          {formatAge(patient.birth_date, exam.exam_date)}
        </p>
        <p className="col-span-2">
          <span className="font-bold">Solicitante</span>: {exam.requesting_doctor}
        </p>
      </section>

      <section className="no-print mt-4 mb-4 rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <span className="font-semibold">
          Referência para a Dra. Monica (não entra no laudo impresso):
        </span>{" "}
        Comorbidades: {exam.comorbidities || "nenhuma relatada"} · Medicações:{" "}
        {exam.medications || "nenhuma relatada"}
      </section>

      <section>{body}</section>

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

        <div
          className="w-56"
          style={{ fontFamily: TIMES_NEW_ROMAN, fontSize: "9pt", textAlign: "right" }}
        >
          {/* O nome fica num bloco inline (largura = largura do próprio
              texto), para a assinatura poder ser centralizada exatamente
              sobre "Dra. Mônica Seixas" (não sobre a coluna inteira) e
              sobrepor só essa linha, como uma assinatura física escaneada
              por cima do nome impresso. */}
          <div className="relative inline-block">
            <div
              className="absolute h-16 w-40"
              style={{
                left: "50%",
                bottom: "-0.3rem",
                transform: "translateX(-50%)",
                zIndex: 0,
              }}
            >
              <Image
                src="/branding/assinatura.jpg"
                alt="Assinatura"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="relative font-medium" style={{ zIndex: 1 }}>
              {DOCTOR_NAME}
            </p>
          </div>
          <p>{DOCTOR_SPECIALTY}</p>
          <p>{DOCTOR_REGISTRATION}</p>
        </div>
      </footer>
    </div>
  );
}
