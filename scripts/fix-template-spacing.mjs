import { readFileSync } from "fs";

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
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Junta os 3 parágrafos iniciais (Condições técnicas / Duração / Motivo) num
// único parágrafo com <br> (sem espaçamento entre eles) e aumenta o espaço
// antes de "Principais achados:".
const PATTERN =
  /<p><strong>Condições técnicas<\/strong>:(.*?)<\/p>\s*<p><strong>Duração:<\/strong>(.*?)<\/p>\s*<p><strong>Motivo\/Indicação clínica:<\/strong>(.*?)<\/p>\s*<p><strong>Principais achados:<\/strong><\/p>/s;

function fixSpacing(html) {
  return html.replace(
    PATTERN,
    (_match, tecnicas, duracao, motivo) =>
      `<p><strong>Condições técnicas</strong>:${tecnicas}<br><strong>Duração:</strong>${duracao}<br><strong>Motivo/Indicação clínica:</strong>${motivo}</p>\n` +
      `<p style="margin-top: 1.5rem;"><strong>Principais achados:</strong></p>`,
  );
}

const res = await fetch(`${base}/rest/v1/report_templates?select=id,name,content_html`, {
  headers,
});
const templates = await res.json();

for (const t of templates) {
  const fixed = fixSpacing(t.content_html);
  if (fixed === t.content_html) {
    console.log(`(sem alteração — padrão não encontrado) ${t.name}`);
    continue;
  }
  const updateRes = await fetch(`${base}/rest/v1/report_templates?id=eq.${t.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ content_html: fixed }),
  });
  console.log(`${updateRes.ok ? "OK" : "ERRO"} — ${t.name}`);
}
