import { readFileSync } from "fs";
import { createHash, createDecipheriv } from "crypto";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const base = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const encKeyHex = env.VIDAAS_SESSION_ENCRYPTION_KEY;
const vidasBase = env.VIDAAS_BASE_URL || "https://certificado.vidaas.com.br";
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

function decryptSecret(payload, keyHex) {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const key = Buffer.from(keyHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

const examId = process.argv[2];
if (!examId) {
  console.error("Uso: node scripts/debug-full-sign-flow.mjs <examId>");
  process.exit(1);
}

// 1) carrega o exame + paciente (igual loadExamWithPatient)
const examRes = await fetch(
  `${base}/rest/v1/exams?id=eq.${examId}&select=*,patient:patients(*)`,
  { headers },
);
const [exam] = await examRes.json();
if (!exam) {
  console.error("Exame não encontrado.");
  process.exit(1);
}
console.log("Exame:", exam.patient.full_name, "- status:", exam.status);

// 2) pega a sessão Vidas ativa
const sessRes = await fetch(`${base}/rest/v1/vidas_sessions?select=*`, { headers });
const [session] = await sessRes.json();
if (!session) {
  console.error("Sem sessão Vidas ativa.");
  process.exit(1);
}
const accessToken = decryptSecret(session.access_token_encrypted, encKeyHex);
console.log("Sessão Vidas expira em:", session.expires_at);

// 3) pega o PDF via a rota de impressão em produção (precisa de um PDF
//    recente baixado manualmente - reaproveita um já gerado localmente,
//    já que gerar via Puppeteer aqui fugiria do que queremos testar).
const pdfPath = process.argv[3];
const pdfBuffer = readFileSync(pdfPath);
console.log("PDF:", pdfBuffer.length, "bytes");

if (pdfBuffer.length > 7 * 1024 * 1024) {
  console.error("PDF excede 7MB.");
  process.exit(1);
}

// 4) assina (igual signExamPdf -> signPdf)
const pdfHashBase64 = createHash("sha256").update(pdfBuffer).digest("base64");
const signRes = await fetch(`${vidasBase}/v0/oauth/signature`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({
    hashes: [
      {
        id: examId,
        alias: `laudo-eeg-${exam.patient.full_name}`,
        hash: pdfHashBase64,
        hash_algorithm: "2.16.840.1.101.3.4.2.1",
        signature_format: "PAdES_AD_RT",
        base64_content: pdfBuffer.toString("base64"),
        padding_method: "PKCS1V1_5",
        pdf_signature_page: false,
      },
    ],
  }),
});

if (!signRes.ok) {
  console.error("Falha ao assinar:", signRes.status, await signRes.text());
  process.exit(1);
}

const signData = await signRes.json();
const signedPdf = Buffer.from(signData.signatures[0].file_base64_signed, "base64");
const certificateAlias = signData.certificate_alias ?? null;
console.log("Assinado com sucesso:", signedPdf.length, "bytes, certificate_alias:", certificateAlias);

// 5) sobe pro Storage privado (igual ao signLaudo)
const signedPath = `${examId}-${Date.now()}.pdf`;
const uploadRes = await fetch(
  `${base}/storage/v1/object/signed-laudos/${signedPath}`,
  {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/pdf" },
    body: signedPdf,
  },
);
if (!uploadRes.ok) {
  console.error("Falha no upload:", uploadRes.status, await uploadRes.text());
  process.exit(1);
}
console.log("Upload ok:", signedPath);

// 6) atualiza o exame (igual signLaudo)
const signedAt = new Date().toISOString();
const updateRes = await fetch(`${base}/rest/v1/exams?id=eq.${examId}`, {
  method: "PATCH",
  headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
  body: JSON.stringify({
    status: "signed",
    signed_at: signedAt,
    signed_by: session.profile_id,
    signature_payload: { provider: "vidas", signedAt, certificateAlias },
    signed_pdf_path: signedPath,
    updated_at: signedAt,
  }),
});
if (!updateRes.ok) {
  console.error("Falha ao atualizar exame:", updateRes.status, await updateRes.text());
  process.exit(1);
}
console.log("Exame atualizado para 'signed' com sucesso!");
console.log(await updateRes.json());
