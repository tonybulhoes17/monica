import "server-only";

/**
 * Cliente HTTP para o PSC do Vidas (Certificado em Nuvem, Valid).
 * Referência: guia de integração VIDAAS_INTEGRATION_HANDOFF.md.
 *
 * Nunca logar client_secret, access_token ou base64 de PDF. Erros guardam
 * só o status HTTP e um trecho curto do corpo de resposta (já sem nossos
 * próprios segredos, que não são ecoados nela).
 */

const BASE_URL =
  process.env.VIDAAS_BASE_URL || "https://certificado.vidaas.com.br";

function requireCredentials() {
  const clientId = process.env.VIDAAS_CLIENT_ID;
  const clientSecret = process.env.VIDAAS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "VIDAAS_CLIENT_ID/VIDAAS_CLIENT_SECRET não configurados no ambiente.",
    );
  }
  return { clientId, clientSecret };
}

export function isVidasConfigured(): boolean {
  return Boolean(
    process.env.VIDAAS_CLIENT_ID &&
      process.env.VIDAAS_CLIENT_SECRET &&
      process.env.VIDAAS_SESSION_ENCRYPTION_KEY,
  );
}

export type VidasScope = "single_signature" | "signature_session";

export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope: VidasScope;
  lifetimeSeconds?: number;
}): string {
  const { clientId } = requireCredentials();
  const url = new URL(`${BASE_URL}/v0/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  if (params.lifetimeSeconds) {
    url.searchParams.set("lifetime", String(params.lifetimeSeconds));
  }
  return url.toString();
}

export interface VidasTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export async function exchangeCodeForToken(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<VidasTokenResponse> {
  const { clientId, clientSecret } = requireCredentials();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
  });

  const res = await fetch(`${BASE_URL}/v0/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Falha ao trocar código por token no Vidas (HTTP ${res.status}): ${text.slice(0, 300)}`,
    );
  }

  return res.json();
}

export interface VidasSignatureResult {
  signedPdfBase64: string;
  certificateAlias: string | null;
}

/**
 * POST /v0/oauth/signature — assina o PDF (PAdES) com o certificado em
 * nuvem do usuário autorizado via `accessToken`.
 *
 * O formato exato da resposta (onde o PDF assinado vem aninhado) deve ser
 * confirmado contra o manual vigente da Valid na primeira integração real;
 * tentamos os formatos mais prováveis listados no guia de handoff.
 */
export async function signPdf(params: {
  accessToken: string;
  pdfBase64: string;
  pdfHashBase64: string;
}): Promise<VidasSignatureResult> {
  const res = await fetch(`${BASE_URL}/v0/oauth/signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      signature_format: "PAdES_AD_RT",
      hash_algorithm: "2.16.840.1.101.3.4.2.1", // OID SHA-256
      padding_method: "PKCS1V1_5",
      pdf_signature_page: false,
      hashes: [
        {
          hash: params.pdfHashBase64,
          base64_content: params.pdfBase64,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Diagnóstico sem vazar segredos: nunca logar accessToken nem o
    // base64 do PDF, só tamanhos/metadados para correlacionar com o
    // traceId que a Valid devolve no corpo do erro.
    console.error("[vidas] signature falhou", {
      status: res.status,
      pdfBytes: Buffer.from(params.pdfBase64, "base64").length,
      hashAlgorithm: "2.16.840.1.101.3.4.2.1",
      paddingMethod: "PKCS1V1_5",
      signatureFormat: "PAdES_AD_RT",
    });
    throw new Error(
      `Falha ao assinar documento no Vidas (HTTP ${res.status}): ${text.slice(0, 4000)}`,
    );
  }

  const data = await res.json();

  const signedBase64: string | undefined =
    data?.signatures?.[0]?.base64_content ??
    data?.signatures?.[0]?.signed_content ??
    data?.base64_content ??
    data?.signed_content;

  if (!signedBase64) {
    throw new Error(
      "Resposta do Vidas não trouxe o PDF assinado no formato esperado — confira o manual atual da Valid e ajuste o parse em src/lib/vidas/psc-client.ts.",
    );
  }

  const certificateAlias: string | null =
    data?.signatures?.[0]?.certificate_alias ?? data?.certificate_alias ?? null;

  return { signedPdfBase64: signedBase64, certificateAlias };
}

export interface VidasDiscoveryResult {
  hasCertificate: boolean;
}

/** POST /v0/oauth/user-discovery — opcional: confere se o CPF já tem certificado em nuvem antes de oferecer "Assinar". */
export async function userDiscovery(cpfDigits: string): Promise<VidasDiscoveryResult> {
  const { clientId, clientSecret } = requireCredentials();

  const res = await fetch(`${BASE_URL}/v0/oauth/user-discovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      user_cpf_cnpj: cpfDigits,
      val_cpf_cnpj: cpfDigits,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Falha na consulta de certificado no Vidas (HTTP ${res.status}): ${text.slice(0, 300)}`,
    );
  }

  const data = await res.json();
  return { hasCertificate: data?.status === "S" };
}
