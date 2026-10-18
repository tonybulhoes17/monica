/**
 * Separa o <h1> inicial do corpo do laudo do resto do conteúdo. Usado na
 * impressão/PDF para poder repetir logo + caixa de dados + título no topo
 * de cada página (ver PAGE_BREAK_MARKER abaixo), já que o título normalmente
 * vive dentro do HTML editável do laudo, não em LaudoShell.
 */
export function splitLeadingHeading(html: string): {
  title: string | null;
  rest: string;
} {
  const match = html.match(/^\s*<h1>([\s\S]*?)<\/h1>\s*/);
  if (!match) return { title: null, rest: html };
  return { title: match[1], rest: html.slice(match[0].length) };
}

/**
 * Marcador opcional que pode ser inserido no meio do content_html de um
 * modelo/laudo para indicar onde deve começar uma nova página impressa,
 * repetindo o cabeçalho (logo + caixa de dados + título) ali — igual ao
 * padrão de laudos de Vídeo-EEG mais longos (2 páginas). Não é detectado
 * automaticamente (a plataforma não mede altura de conteúdo); precisa ser
 * colocado manualmente no texto do modelo no ponto onde a 2ª página deve
 * começar. Ver `splitOnPageBreaks` e o uso em
 * src/app/(print)/laudos/[examId]/imprimir/page.tsx.
 */
export const PAGE_BREAK_MARKER = "<!--quebra-de-pagina-->";

/** Divide o HTML em pedaços nos pontos marcados por PAGE_BREAK_MARKER. */
export function splitOnPageBreaks(html: string): string[] {
  return html.split(PAGE_BREAK_MARKER);
}

/**
 * Corrige um bug de impressão: ao apertar Enter duas vezes no editor pra
 * abrir um espaço extra entre linhas, o Tiptap salva um `<p></p>` vazio de
 * verdade. Isso aparece com altura normal DURANTE a edição (o
 * ProseMirror insere um <br> interno só na tela, pra manter o parágrafo
 * clicável, que não entra no HTML salvo) mas colapsa pra altura zero no
 * motor de impressão/PDF, porque um <p> genuinamente vazio não tem
 * nenhuma caixa de linha pra aplicar o line-height. Trocar por
 * `<p><br></p>` resolve nos dois casos.
 */
export function normalizeEmptyParagraphs(html: string): string {
  return html.replace(/<p>\s*<\/p>/g, "<p><br></p>");
}
