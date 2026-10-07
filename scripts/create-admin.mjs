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

const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const [email, password, fullName = "Monica Seixas", crm = "CRMBA 28539", rqe = "RQE 19407"] =
  process.argv.slice(2);

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const createRes = await fetch(`${baseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers,
  body: JSON.stringify({ email, password, email_confirm: true }),
});
const created = await createRes.json();

if (!createRes.ok) {
  console.error("Erro ao criar usuário:", created);
  process.exit(1);
}

const profileRes = await fetch(`${baseUrl}/rest/v1/profiles`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify({
    id: created.id,
    full_name: fullName,
    role: "admin",
    crm,
    rqe,
  }),
});

if (!profileRes.ok) {
  console.error("Erro ao criar perfil:", await profileRes.json());
  process.exit(1);
}

console.log("Admin criado com sucesso:", created.id);
