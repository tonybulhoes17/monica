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
  options?: {
    /**
     * Usado só por signLaudo() (ver laudos/[examId]/actions.ts): renderiza
     * o laudo já com o selo de assinatura (como se `signedAt` fosse o
     * horário final) antes de mandar pro Vidas assinar de verdade — sem
     * isso, o PDF que fica salvo como documento assinado mostra pra
     * sempre o placeholder "não assinado", já que é renderizado antes do
     * status no banco virar "signed".
     */
    previewSignedAt?: string;
  },
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
    const previewParam = options?.previewSignedAt
      ? `&previewSignedAt=${encodeURIComponent(options.previewSignedAt)}`
      : "";

    // Mede o conteúdo já renderizado pra calcular quanto falta pro fim da
    // última página impressa, e empurrar a assinatura pra lá (ver
    // #laudo-footer-spacer em LaudoShell). Importante: essa medição
    // precisa acontecer no MESMO viewport que o page.pdf() abaixo vai usar
    // — descobrimos (testando e comparando a contagem real de páginas)
    // que page.pdf() NÃO lê a largura de @page/margin pra decidir a
    // largura do layout; ele deita o HTML na largura do viewport atual
    // (aqui, o padrão do Puppeteer, 800px — maior que os 210mm de
    // max-w-[210mm] do .laudo-page, que acaba sendo o limite de verdade) e
    // só usa @page pra cortar o resultado em folhas A4. @page's margin
    // top/bottom continuam valendo pra saber quanto cabe de altura por
    // folha.
    // MARGIN_TOP_MM precisa bater com a margem superior do @page em
    // globals.css e com o `margin.top` do page.pdf() logo abaixo — reduzida
    // pra aproveitar mais a folha A4 (o laudo começa mais perto do topo).
    const PAGE_HEIGHT_MM = 297;
    const MARGIN_TOP_MM = 10;
    const MARGIN_BOTTOM_MM = 18;
    const mmToPx = (mm: number) => (mm * 96) / 25.4;
    const contentHeightPx = mmToPx(PAGE_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM);

    await page.emulateMediaType("print");
    await page.goto(`${baseUrl}/laudos/${examId}/imprimir?pdf=1${previewParam}`, {
      waitUntil: "networkidle0",
    });

    await page.evaluate((contentHeightPx: number) => {
      const table = document.getElementById("laudo-repeating-table");
      const spacer = document.getElementById("laudo-footer-spacer");
      const footer = document.getElementById("laudo-footer-block");
      if (!table || !spacer || !footer) return;

      const theadHeight =
        table.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      const tbodyHeight =
        table.querySelector("tbody")?.getBoundingClientRect().height ?? 0;
      const footerHeight = footer.getBoundingClientRect().height;

      const usablePerPage = contentHeightPx - theadHeight;
      if (usablePerPage <= 0) return;

      const numPages = Math.max(1, Math.ceil(tbodyHeight / usablePerPage));
      const remainderOnLastPage = numPages * usablePerPage - tbodyHeight;

      spacer.style.height = `${Math.max(0, remainderOnLastPage - footerHeight)}px`;
    }, contentHeightPx);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
