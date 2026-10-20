import Paragraph from "@tiptap/extension-paragraph";

/**
 * Paragraph com um atributo extra `spacing` (margin-top/bottom em rem),
 * aplicável por parágrafo individual — alimenta o seletor de espaçamento na
 * barra de ferramentas do editor (ver rich-text-editor.tsx), permitindo
 * escolher o espaçamento de um trecho específico do laudo (ex: deixar
 * "Conclusão" mais compacto que o resto do texto). Sem esse atributo, o
 * parágrafo usa o espaçamento padrão definido em .laudo-prose p (globals.css).
 */
export const ParagraphWithSpacing = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      spacing: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.marginTop || null,
        renderHTML: (attributes: { spacing?: string | null }) => {
          if (!attributes.spacing) return {};
          return {
            style: `margin-top: ${attributes.spacing}; margin-bottom: ${attributes.spacing};`,
          };
        },
      },
    };
  },
});

export const PARAGRAPH_SPACING_OPTIONS = [
  { value: "", label: "Espaçamento padrão" },
  { value: "0.4rem", label: "Compacto (0,4)" },
  { value: "0.8rem", label: "Normal (0,8)" },
  { value: "1.2rem", label: "Grande (1,2)" },
  { value: "1.5rem", label: "Extra (1,5)" },
];
