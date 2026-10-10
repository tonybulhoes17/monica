import Image from "next/image";
import type { ExamWithPatient } from "@/lib/database.types";
import { formatAge } from "@/lib/age";

function formatDateBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

interface LaudoShellProps {
  exam: ExamWithPatient;
  body: React.ReactNode;
  /** Data URL (PNG) do QR code de validação — só é usado quando o laudo tem assinatura real do Vidas. */
  qrCodeDataUrl?: string | null;
  /**
   * Omite o cabeçalho (logo + caixa de dados do paciente) daqui — usado
   * apenas na renderização para o Puppeteer (`?pdf=1`), onde o cabeçalho
   * já é injetado separadamente pelo `headerTemplate` do `page.pdf()`
   * (ver src/lib/pdf.ts) e se repete sozinho em toda página gerada.
   * Renderizá-lo aqui também duplicaria o cabeçalho na 1ª página.
   */
  hideHeader?: boolean;
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

function ShieldCheckIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none">
      <path
        d="M12 2l8 3.5v5.2c0 5.1-3.4 9.4-8 11.3-4.6-1.9-8-6.2-8-11.3V5.5L12 2z"
        fill="currentColor"
      />
      <path
        d="M8.5 12.2l2.4 2.4 4.6-4.9"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignatureNameBlock() {
  return (
    <div
      className="w-56 shrink-0"
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
  );
}

export function LaudoShell({
  exam,
  body,
  qrCodeDataUrl,
  hideHeader,
}: LaudoShellProps) {
  const { patient, institution } = exam;
  const isSigned = exam.status === "signed";
  const signature = exam.signature_payload as
    | { provider?: string; signedAt?: string; certificateAlias?: string }
    | null;
  const logoUrl = institution?.logo_url || "/branding/logo.png";
  const isRealVidasSignature = isSigned && signature?.provider === "vidas";

  const signedDate = signature?.signedAt
    ? new Date(signature.signedAt).toLocaleDateString("pt-BR")
    : "";
  const signedTime = signature?.signedAt
    ? new Date(signature.signedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const doctorNameUpper = DOCTOR_NAME.replace(/^Dra?\.\s*/, "").toUpperCase();

  return (
    <div className="laudo-page mx-auto w-full max-w-[210mm] border border-slate-200 p-10 shadow-sm print:border-0 print:p-0 print:shadow-none">
      {!hideHeader && (
        <>
          <header className="mb-3 flex items-end gap-4">
            <div
              className="relative shrink-0"
              style={{ width: "4.8cm", height: "2.4cm" }}
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
            className="laudo-patient-box mb-3 grid grid-cols-2 gap-x-6 gap-y-1 px-4 py-3 text-slate-900"
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
        </>
      )}

      <section className="no-print mt-4 mb-4 rounded-md border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <span className="font-semibold">
          Referência para a Dra. Monica (não entra no laudo impresso):
        </span>{" "}
        Comorbidades: {exam.comorbidities || "nenhuma relatada"} · Medicações:{" "}
        {exam.medications || "nenhuma relatada"}
      </section>

      <section>{body}</section>

      {isRealVidasSignature ? (
        <footer className="mt-10 flex items-start justify-between gap-4 text-slate-700">
          {/* Selo de assinatura eletrônica qualificada (ICP-Brasil) */}
          <div className="w-32 shrink-0" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
            <div
              className="flex items-center gap-1 rounded px-1.5 py-1 text-white"
              style={{ backgroundColor: "#15803d" }}
            >
              <ShieldCheckIcon className="h-5 w-5 shrink-0" />
              <span className="text-[7.5px] font-bold leading-[1.1]">
                ASSINATURA ELETRÔNICA QUALIFICADA
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[7px] leading-tight text-slate-600">
              <ShieldCheckIcon className="h-2.5 w-2.5 shrink-0" style={{ color: "#15803d" }} />
              ICP Conforme MP 2.200-2/01 e Lei 14.063/2020
            </p>
          </div>

          {/* Texto legal + QR code de validação */}
          <div className="flex flex-1 items-center gap-3">
            <p
              className="text-[7.5px] leading-snug text-slate-700"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Laudo de eletroencefalograma assinado digitalmente por{" "}
              {doctorNameUpper}, {DOCTOR_REGISTRATION} em {signedDate},{" "}
              {signedTime}, conforme MP nº 2.200-2/2001, Resolução Nº CFM
              2.299/2021 e Resolução CFM Nº 2.381/2024. Valide em
              validar.iti.gov.br ou escaneie o QR Code ao lado.
            </p>
            {qrCodeDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL, não passa por otimização de imagem
              <img
                src={qrCodeDataUrl}
                alt="QR code de validação"
                width={56}
                height={56}
                className="shrink-0"
              />
            )}
          </div>

          <SignatureNameBlock />
        </footer>
      ) : (
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

          <SignatureNameBlock />
        </footer>
      )}
    </div>
  );
}
