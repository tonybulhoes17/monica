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
