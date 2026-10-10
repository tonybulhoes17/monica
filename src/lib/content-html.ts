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
