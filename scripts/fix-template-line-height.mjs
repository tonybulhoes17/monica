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

// 1) Junta Condições técnicas / Duração / Motivo num único parágrafo (caso
//    ainda estejam separados — rascunhos antigos criados antes da correção
//    anterior) e 2) aperta o entrelinhas desse parágrafo específico.
const MERGE_PATTERN =
  /<p><strong>Condições técnicas<\/strong>:(.*?)<\/p>\s*<p><strong>Duração:<\/strong>(.*?)<\/p>\s*<p><strong>Motivo\/Indicação clínica:<\/strong>(.*?)<\/p>\s*<p><strong>Principais achados:<\/strong><\/p>/s;

function fixContent(html) {
  let result = html;

  if (MERGE_PATTERN.test(result)) {
    result = result.replace(
      MERGE_PATTERN,
      (_match, tecnicas, duracao, motivo) =>
        `<p style="line-height: 1.15;"><strong>Condições técnicas</strong>:${tecnicas}<br><strong>Duração:</strong>${duracao}<br><strong>Motivo/Indicação clínica:</strong>${motivo}</p>\n` +
        `<p style="margin-top: 1.5rem;"><strong>Principais achados:</strong></p>`,
    );
  } else if (result.includes('<p><strong>Condições técnicas</strong>:')) {
    // já estava juntado (correção anterior), só falta apertar o entrelinhas
    result = result.replace(
      '<p><strong>Condições técnicas</strong>:',
      '<p style="line-height: 1.15;"><strong>Condições técnicas</strong>:',
    );
  }

  return result;
}

async function run(table) {
  // Nunca mexer em laudos já assinados — só rascunhos/pendentes.
  const statusFilter = table === "exams" ? "&status=neq.signed" : "";
  const res = await fetch(
    `${base}/rest/v1/${table}?select=id,content_html&content_html=not.is.null${statusFilter}`,
    { headers },
  );
  const rows = await res.json();
  for (const row of rows) {
    if (!row.content_html) continue;
    const fixed = fixContent(row.content_html);
    if (fixed === row.content_html) continue;
    const updateRes = await fetch(`${base}/rest/v1/${table}?id=eq.${row.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ content_html: fixed }),
    });
    console.log(`${table} ${row.id}: ${updateRes.ok ? "OK" : "ERRO"}`);
  }
}

await run("report_templates");
await run("exams");
