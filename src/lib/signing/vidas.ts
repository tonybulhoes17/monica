import "server-only";

export interface SigningRequest {
  examId: string;
  signerName: string;
  signerCrm: string | null;
}

export interface SigningResult {
  provider: "vidas" | "simulated";
  signedAt: string;
  certificateId: string;
  raw: Record<string, unknown>;
}

const isVidasConfigured = Boolean(
  process.env.VIDAS_API_BASE_URL &&
    process.env.VIDAS_API_CLIENT_ID &&
    process.env.VIDAS_API_CLIENT_SECRET,
);

/**
 * Ponto único de integração com o Vidas. Enquanto as credenciais da API não
 * chegarem (VIDAS_API_BASE_URL/CLIENT_ID/CLIENT_SECRET em .env), cai no modo
 * simulado — assina localmente sem nenhuma validação jurídica real, só para
 * permitir testar o resto do fluxo (laudo -> assinar -> PDF -> storage).
 *
 * Quando as credenciais chegarem: substituir o corpo do `if (!isVidasConfigured)`
 * pela chamada real à API do Vidas (provavelmente um fluxo OAuth + upload do
 * PDF para assinatura), mantendo a mesma assinatura de função.
 */
export async function signDocument(
  request: SigningRequest,
): Promise<SigningResult> {
  if (!isVidasConfigured) {
    return {
      provider: "simulated",
      signedAt: new Date().toISOString(),
      certificateId: `SIMULADO-${request.examId.slice(0, 8)}`,
      raw: { warning: "Integração real com o Vidas ainda não configurada." },
    };
  }

  throw new Error(
    "Integração real com a API do Vidas ainda não implementada. " +
      "Configure VIDAS_API_BASE_URL/CLIENT_ID/CLIENT_SECRET e implemente a chamada em src/lib/signing/vidas.ts.",
  );
}

export function isUsingSimulatedSigning(): boolean {
  return !isVidasConfigured;
}
