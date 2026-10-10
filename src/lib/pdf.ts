import "server-only";
import { readFileSync } from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { splitLeadingHeading } from "@/lib/content-html";
import { formatAge } from "@/lib/age";

// Precisa bater exatamente com a versão instalada de @sparticuz/chromium-min
// no package.json (o pacote não segue semver — mudanças de patch podem ser
// incompatíveis). Ao atualizar o pacote, atualizar esta constante junto,
// conferindo o asset "chromium-v<versão>-pack.x64.tar" em
// https://github.com/Sparticuz/chromium/releases
const CHROMIUM_PACK_VERSION = "147.0.0";

const SERVICE_LINES = [
  "NEUROFISIOLOGIA CLÍNICA",
  "ELETROENCEFALOGRAMA DIGITAL (EEG)",
  "VÍDEO- ELETROENCEFALOGRAMA (VÍDEO-EEG)",
];

// Altura reservada no topo de cada página para o cabeçalho repetido
// (logo + caixa de dados + título) — ver buildHeaderTemplate().
const HEADER_MARGIN = "72mm";
const SIDE_MARGIN = "16mm";
const BOTTOM_MARGIN = "18mm";

function formatDateBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fileToDataUri(absPath: string, mime: string): string {
  const bytes = readFileSync(absPath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/**
 * Monta o HTML do `headerTemplate` do Puppeteer — é isso que o Chromium
 * repete sozinho no topo de TODA página do PDF gerado (diferente do
 * conteúdo normal da página, que só aparece uma vez e flui naturalmente).
 * Precisa ficar visualmente idêntico ao cabeçalho renderizado em
 * `src/components/laudo-shell.tsx` (logo, 3 linhas de serviço, caixa de
 * dados do paciente, título) — se um mudar, o outro precisa acompanhar.
 *
 * Usa imagens/fontes embutidas como data URI porque o headerTemplate é
 * renderizado num contexto isolado do Chromium que não necessariamente
 * carrega os mesmos recursos/sessão autenticada da página principal.
 */
async function buildHeaderTemplate(examId: string): Promise<string> {
  const admin = createAdminClient();
  const { data: exam } = await admin
    .from("exams")
    .select(
      "exam_date, requesting_doctor, content_html, patient:patients(full_name, birth_date), institution:institutions(logo_url)",
    )
    .eq("id", examId)
    .single();

  if (!exam) {
    throw new Error("Exame não encontrado ao montar o cabeçalho do PDF.");
  }

  const { title } = splitLeadingHeading(exam.content_html ?? "");

  let logoDataUri: string;
  const institutionLogoUrl = exam.institution?.logo_url;
  if (institutionLogoUrl && institutionLogoUrl.startsWith("http")) {
    const res = await fetch(institutionLogoUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/png";
    logoDataUri = `data:${contentType};base64,${buf.toString("base64")}`;
  } else {
    logoDataUri = fileToDataUri(
      path.join(process.cwd(), "public", "branding", "logo.png"),
      "image/png",
    );
  }

  const fontsDir = path.join(process.cwd(), "public", "fonts", "tinos");
  const tinosRegular = fileToDataUri(
    path.join(fontsDir, "tinos-regular-latin.woff2"),
    "font/woff2",
  );
  const tinosBold = fileToDataUri(
    path.join(fontsDir, "tinos-bold-latin.woff2"),
    "font/woff2",
  );

  const patientName = exam.patient?.full_name ?? "";
  const birthDate = exam.patient?.birth_date ?? "";
  const age = birthDate ? formatAge(birthDate, exam.exam_date) : "";

  return `
    <style>
      @font-face { font-family: 'TinosHeader'; font-weight: 400; src: url('${tinosRegular}') format('woff2'); }
      @font-face { font-family: 'TinosHeader'; font-weight: 700; src: url('${tinosBold}') format('woff2'); }
      .h-wrap {
        width: 100%;
        box-sizing: border-box;
        padding: 0 ${SIDE_MARGIN};
        font-family: 'Times New Roman', 'TinosHeader', Times, serif;
        color: #0f172a;
        -webkit-print-color-adjust: exact;
      }
      .h-top { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 9px; }
      .h-logo { width: 4.8cm; height: 2.4cm; object-fit: contain; flex-shrink: 0; }
      .h-service p { margin: 0; font-size: 12pt; font-weight: 700; line-height: 1.25; }
      .h-box {
        border: 2.25pt solid #002060;
        box-sizing: border-box;
        padding: 12px 16px;
        margin-bottom: 9px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 24px;
        row-gap: 4px;
        font-size: 12pt;
      }
      .h-box p { margin: 0; }
      .h-box b { font-weight: 700; }
      .h-title { font-size: 14pt; font-weight: 700; text-align: center; text-decoration: underline; margin: 0; }
    </style>
    <div class="h-wrap">
      <div class="h-top">
        <img class="h-logo" src="${logoDataUri}" />
        <div class="h-service">
          ${SERVICE_LINES.map((line) => `<p>${line}</p>`).join("")}
        </div>
      </div>
      <div class="h-box">
        <p><b>Nome</b>: ${escapeHtml(patientName)}</p>
        <p><b>Data do exame</b>: ${formatDateBr(exam.exam_date)}</p>
        <p><b>Data de Nascimento</b>: ${birthDate ? formatDateBr(birthDate) : ""}</p>
        <p><b>Idade</b>: ${age}</p>
        <p style="grid-column: 1 / span 2;"><b>Solicitante</b>: ${escapeHtml(exam.requesting_doctor)}</p>
      </div>
      ${title ? `<p class="h-title">${escapeHtml(title)}</p>` : ""}
    </div>
  `;
}

/**
 * Renderiza a rota de impressão do laudo (/laudos/[id]/imprimir) com um
 * Chromium headless e devolve o PDF resultante. O cabeçalho (logo + caixa
 * de dados + título) é injetado via `headerTemplate` do Puppeteer, que o
 * repete sozinho em toda página — é assim que a 2ª página em diante
 * também sai com o mesmo cabeçalho da 1ª (a página renderizada em si
 * passa `hideHeader`/corta o <h1> inicial para não duplicar).
 *
 * Em produção na Vercel usa puppeteer-core + @sparticuz/chromium-min
 * (binário leve, compatível com funções serverless). Em desenvolvimento
 * local usa o pacote `puppeteer` completo (já traz um Chromium baixado).
 */
export async function renderExamPdf(
  examId: string,
  baseUrl: string,
  cookieHeader: string | null,
): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL);

  let browser;
  if (isServerless) {
    const puppeteerCore = await import("puppeteer-core");
    const chromium = (await import("@sparticuz/chromium-min")).default;
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_PACK_VERSION}/chromium-v${CHROMIUM_PACK_VERSION}-pack.x64.tar`,
      ),
      headless: true,
    });
  } else {
    const puppeteer = await import("puppeteer");
    browser = await puppeteer.launch({ headless: true });
  }

  try {
    const headerTemplate = await buildHeaderTemplate(examId);

    const page = await browser.newPage();
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    }
    await page.goto(`${baseUrl}/laudos/${examId}/imprimir?pdf=1`, {
      waitUntil: "networkidle0",
    });
    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate: "<div></div>",
      margin: {
        top: HEADER_MARGIN,
        bottom: BOTTOM_MARGIN,
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
