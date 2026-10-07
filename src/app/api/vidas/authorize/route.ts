import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateCodeChallenge, generateCodeVerifier, generateState } from "@/lib/vidas/pkce";
import { buildAuthorizeUrl } from "@/lib/vidas/psc-client";

// Padrão: sessão de assinatura dura o dia de trabalho inteiro (12h), para a
// Dra. Monica só precisar escanear o QR code do Vidas uma vez por dia, não
// a cada laudo assinado.
const DEFAULT_SESSION_LIFETIME_SECONDS = 12 * 60 * 60;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 600,
  path: "/api/vidas",
};

export async function GET(request: NextRequest) {
  await requireAdmin();

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/vidas/callback`;

  const lifetimeSeconds = Number(
    process.env.VIDAAS_SESSION_LIFETIME_SECONDS ?? DEFAULT_SESSION_LIFETIME_SECONDS,
  );

  const authorizeUrl = buildAuthorizeUrl({
    codeChallenge,
    state,
    redirectUri,
    scope: "signature_session",
    lifetimeSeconds,
  });

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("vidas_code_verifier", codeVerifier, COOKIE_OPTIONS);
  response.cookies.set("vidas_state", state, COOKIE_OPTIONS);
  response.cookies.set("vidas_return_to", returnTo, COOKIE_OPTIONS);
  return response;
}
