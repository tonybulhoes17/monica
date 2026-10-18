const LOWERCASE_CONNECTORS = new Set(["de", "da", "do", "das", "dos", "e"]);

/**
 * "JOÃO antonio DA SILVA" -> "João Antonio da Silva". Usado para exibir
 * nome do paciente/médico solicitante de forma consistente no laudo,
 * independente de como foi digitado no cadastro. Conectores comuns em
 * nomes (de/da/do/das/dos/e) ficam minúsculos, exceto na primeira palavra.
 */
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && LOWERCASE_CONNECTORS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
