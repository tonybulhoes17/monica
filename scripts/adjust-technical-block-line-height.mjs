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

function fixContent(html) {
  return html.replace(
    '<p style="line-height: 1.15;"><strong>Condições técnicas</strong>:',
    '<p style="line-height: 1.3;"><strong>Condições técnicas</strong>:',
  );
}

async function run(table) {
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
