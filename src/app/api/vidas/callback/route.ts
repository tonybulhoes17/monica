import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { exchangeCodeForToken } from "@/lib/vidas/psc-client";
import { saveVidasSession } from "@/lib/vidas/session";

const DEFAULT_SESSION_LIFETIME_SECONDS = 12 * 60 * 60;

function redirectWithParam(
  origin: string,
  returnTo: string,
  key: string,
  value: string,
) {
  const url = new URL(returnTo, origin);
  url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  response.cookies.delete("vidas_code_verifier");
  response.cookies.delete("vidas_state");
  response.cookies.delete("vidas_return_to");
  return response;
}

export async function GET(request: NextRequest) {
  // Exige que a Dra. Monica ainda esteja logada no app quando o Vidas
  // redireciona de volta (mesma aba/navegador que iniciou o fluxo) — é
  // assim que sabemos a qual perfil atrelar a sessão de assinatura.
  const admin = await requireAdmin();

  const params = request.nextUrl.searchParams;
  const returnTo = request.cookies.get("vidas_return_to")?.value ?? "/dashboard";

  const pscError = params.get("error");
  if (pscError) {
    return redirectWithParam(request.nextUrl.origin, returnTo, "vidas_error", pscError);
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get("vidas_state")?.value;
  const codeVerifier = request.cookies.get("vidas_code_verifier")?.value;

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return redirectWithParam(
      request.nextUrl.origin,
      returnTo,
      "vidas_error",
      "state_mismatch",
    );
  }

  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/vidas/callback`;

  try {
    const token = await exchangeCodeForToken({ code, codeVerifier, redirectUri });

    const lifetimeSeconds =
      token.expires_in ??
      Number(process.env.VIDAAS_SESSION_LIFETIME_SECONDS ?? DEFAULT_SESSION_LIFETIME_SECONDS);
    const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

    await saveVidasSession({
      profileId: admin.id,
      accessToken: token.access_token,
      expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "token_exchange_failed";
    return redirectWithParam(request.nextUrl.origin, returnTo, "vidas_error", message);
  }

  return redirectWithParam(request.nextUrl.origin, returnTo, "vidas_connected", "1");
}
