import "server-only";
import { createHash } from "crypto";
import { isVidasConfigured, signPdf } from "@/lib/vidas/psc-client";
import { getActiveVidasSession } from "@/lib/vidas/session";

export class VidasReauthorizationRequiredError extends Error {
  constructor() {
    super("É necessário autorizar a assinatura digital pelo Vidas.");
    this.name = "VidasReauthorizationRequiredError";
  }
}

export interface SignPdfResult {
  provider: "vidas" | "simulated";
  signedAt: string;
  certificateAlias: string | null;
  /** PDF assinado (PAdES) vindo do Vidas — null no modo simulado. */
  signedPdf: Buffer | null;
}

/**
 * Ponto único de integração com o Vidas. Se as credenciais
 * (VIDAAS_CLIENT_ID/CLIENT_SECRET/SESSION_ENCRYPTION_KEY) não estiverem
 * configuradas, cai no modo simulado — assina localmente sem validade
 * jurídica real, só para testar o resto do fluxo.
 *
 * Com credenciais configuradas: exige uma sessão Vidas ativa (ver
 * src/lib/vidas/session.ts) — se não houver, lança
 * VidasReauthorizationRequiredError para o chamador redirecionar o admin
 * para /api/vidas/authorize.
 */
export async function signExamPdf(params: {
  profileId: string;
  pdfBuffer: Buffer;
}): Promise<SignPdfResult> {
  if (!isVidasConfigured()) {
    return {
      provider: "simulated",
      signedAt: new Date().toISOString(),
      certificateAlias: null,
      signedPdf: null,
    };
  }

  const session = await getActiveVidasSession(params.profileId);
  if (!session) {
    throw new VidasReauthorizationRequiredError();
  }

  const pdfHashBase64 = createHash("sha256")
    .update(params.pdfBuffer)
    .digest("base64");

  const result = await signPdf({
    accessToken: session.accessToken,
    pdfBase64: params.pdfBuffer.toString("base64"),
    pdfHashBase64,
  });

  return {
    provider: "vidas",
    signedAt: new Date().toISOString(),
    certificateAlias: result.certificateAlias,
    signedPdf: Buffer.from(result.signedPdfBase64, "base64"),
  };
}
