-- O espaçamento padrão entre parágrafos do laudo passou de 0,4rem para
-- 0,8rem (ver mudança anterior em globals.css). O parágrafo "Conclusão:"
-- fica melhor mais compacto (ele só antecede uma lista curta), então volta
-- para 0,4rem aqui, via o mesmo mecanismo de espaçamento por parágrafo que
-- o editor agora expõe na barra de ferramentas (estilo inline
-- margin-top/margin-bottom, reconhecido pela extensão ParagraphWithSpacing
-- em src/components/tiptap-paragraph-spacing.ts).

update public.report_templates
set content_html = replace(
  content_html,
  '<p><strong>Conclusão:</strong></p>',
  '<p style="margin-top: 0.4rem; margin-bottom: 0.4rem;"><strong>Conclusão:</strong></p>'
)
where content_html like '%<p><strong>Conclusão:</strong></p>%';

-- Mesma correção em laudos já em edição (rascunho), nunca em laudos já
-- assinados — o PDF assinado não deve divergir do que foi assinado.
update public.exams
set content_html = replace(
  content_html,
  '<p><strong>Conclusão:</strong></p>',
  '<p style="margin-top: 0.4rem; margin-bottom: 0.4rem;"><strong>Conclusão:</strong></p>'
)
where status <> 'signed'
  and content_html like '%<p><strong>Conclusão:</strong></p>%';
