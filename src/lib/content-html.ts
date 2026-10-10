/**
 * Separa o <h1> inicial do corpo do laudo do resto do conteúdo. Usado na
 * impressão/PDF para poder repetir logo+caixa de dados+título no topo de
 * cada página (ver `.laudo-print-header` em globals.css), já que o título
 * normalmente vive dentro do HTML editável do laudo, não em LaudoShell.
 */
export function splitLeadingHeading(html: string): {
  title: string | null;
  rest: string;
} {
  const match = html.match(/^\s*<h1>([\s\S]*?)<\/h1>\s*/);
  if (!match) return { title: null, rest: html };
  return { title: match[1], rest: html.slice(match[0].length) };
}
