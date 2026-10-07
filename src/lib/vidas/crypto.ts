import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Criptografia simétrica (AES-256-GCM) para guardar o access_token do Vidas
 * em repouso no banco — nunca em texto puro. Chave vem de
 * VIDAAS_SESSION_ENCRYPTION_KEY (32 bytes em hex, gerar com
 * `openssl rand -hex 32`).
 */
function getKey(): Buffer {
  const hex = process.env.VIDAAS_SESSION_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("VIDAAS_SESSION_ENCRYPTION_KEY não configurada.");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "VIDAAS_SESSION_ENCRYPTION_KEY precisa ter 32 bytes (64 caracteres hex). Gere com: openssl rand -hex 32",
    );
  }
  return key;
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Payload criptografado do Vidas em formato inválido.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
