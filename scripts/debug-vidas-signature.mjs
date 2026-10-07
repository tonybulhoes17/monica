import { readFileSync } from "fs";
import { createHash, createDecipheriv, randomUUID } from "crypto";

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

const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
const sessRes = await fetch(`${base}/rest/v1/vidas_sessions?select=*`, { headers });
const sessions = await sessRes.json();
if (!sessions[0]) {
  console.error("Nenhuma sessão Vidas encontrada.");
  process.exit(1);
}
const accessToken = decryptSecret(sessions[0].access_token_encrypted, encKeyHex);
console.log("Sessão encontrada, expira em:", sessions[0].expires_at);

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Uso: node scripts/debug-vidas-signature.mjs <caminho-do-pdf>");
  process.exit(1);
}
const pdfBuffer = readFileSync(pdfPath);
console.log("PDF carregado:", pdfBuffer.length, "bytes");

const pdfBase64 = pdfBuffer.toString("base64");
const pdfHashBase64 = createHash("sha256").update(pdfBuffer).digest("base64");

const SHA256_OID = "2.16.840.1.101.3.4.2.1";

const body = {
  hashes: [
    {
      id: randomUUID(),
      alias: "laudo-eeg-teste",
      hash: pdfHashBase64,
      hash_algorithm: SHA256_OID,
      signature_format: "PAdES_AD_RT",
      base64_content: pdfBase64,
      padding_method: "PKCS1V1_5",
      pdf_signature_page: false,
    },
  ],
};

console.log("Chamando POST /v0/oauth/signature (estrutura aninhada)...");
const res = await fetch(`${vidasBase}/v0/oauth/signature`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("Corpo completo da resposta:");
console.log(text);
