/**
 * Registro único da aplicação no PSC do Vidas (Valid) — POST /v0/oauth/application.
 * Só precisa rodar uma vez (ou de novo se for registrar outro redirect_uri
 * além do inicial, embora PUT /v0/oauth/client_maintenance sirva melhor
 * pra isso depois).
 *
 * Uso:
 *   node scripts/vidas-register-application.mjs \
 *     --name "Laudos de EEG - Dra. Monica Seixas" \
 *     --email "email-da-dra-monica@exemplo.com" \
 *     --redirect "https://laudos-eeg-monica.vercel.app/api/vidas/callback" \
 *     --comments "Plataforma interna de laudos de EEG"
 *
 * Imprime client_id e client_secret retornados — guarde-os em
 * VIDAAS_CLIENT_ID / VIDAAS_CLIENT_SECRET (.env.local e Vercel), nunca em
 * texto solto em nenhum outro lugar.
 */

function parseArgs() {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .reduce((pairs, arg, i, arr) => {
        if (arg.startsWith("--")) pairs.push([arg.slice(2), arr[i + 1]]);
        return pairs;
      }, []),
  );
  return args;
}

const args = parseArgs();
const baseUrl = process.env.VIDAAS_BASE_URL || "https://certificado.vidaas.com.br";

if (!args.name || !args.email || !args.redirect || !args.comments) {
  console.error(
    "Uso: node scripts/vidas-register-application.mjs --name \"...\" --email \"...\" --redirect \"https://.../api/vidas/callback\" --comments \"...\"",
  );
  process.exit(1);
}

const res = await fetch(`${baseUrl}/v0/oauth/application`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: args.name,
    email: args.email,
    redirect_uris: [args.redirect],
    comments: args.comments,
  }),
});

const body = await res.text();

if (!res.ok) {
  console.error(`Falha ao registrar aplicação (HTTP ${res.status}):`);
  console.error(body);
  process.exit(1);
}

const data = JSON.parse(body);
console.log("Aplicação registrada com sucesso. Guarde estas credenciais:");
console.log("VIDAAS_CLIENT_ID=" + (data.client_id ?? "(ver campo correto na resposta abaixo)"));
console.log("VIDAAS_CLIENT_SECRET=" + (data.client_secret ?? "(ver campo correto na resposta abaixo)"));
console.log("\nResposta completa:");
console.log(JSON.stringify(data, null, 2));
