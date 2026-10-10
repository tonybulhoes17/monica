import "server-only";

// Precisa bater exatamente com a versão instalada de @sparticuz/chromium-min
// no package.json (o pacote não segue semver — mudanças de patch podem ser
// incompatíveis). Ao atualizar o pacote, atualizar esta constante junto,
// conferindo o asset "chromium-v<versão>-pack.x64.tar" em
// https://github.com/Sparticuz/chromium/releases
const CHROMIUM_PACK_VERSION = "147.0.0";

/**
 * Renderiza a rota de impressão do laudo (/laudos/[id]/imprimir) com um
 * Chromium headless e devolve o PDF resultante — garante que o PDF fica
 * pixel-a-pixel igual ao que aparece na tela/impressão do navegador.
 *
 * Em produção na Vercel usa puppeteer-core + @sparticuz/chromium-min
 * (binário leve, compatível com funções serverless). Em desenvolvimento
 * local usa o pacote `puppeteer` completo (já traz um Chromium baixado).
 *
 * NOTA sobre o cabeçalho repetido em laudos de várias páginas: NÃO use
 * `page.pdf({ displayHeaderFooter: true, headerTemplate })` aqui — o
 * binário que o @sparticuz/chromium-min baixa é o "chrome-headless-shell",
 * que tem um bug confirmado do próprio Puppeteer em que header/footer
 * templates não funcionam de forma confiável no Linux (ver
 * https://github.com/puppeteer/puppeteer/issues/12196). Funciona
 * perfeitamente local (puppeteer completo) e quebra só em produção. A
 * repetição do cabeçalho é feita via marcador dentro do próprio
 * content_html + CSS `break-before: page` — ver `imprimir/page.tsx` e
 * `LaudoHeaderBlock` em `laudo-shell.tsx`.
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
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
