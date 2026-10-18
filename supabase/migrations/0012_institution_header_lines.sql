-- Texto do cabeçalho (ao lado da logo) agora pode variar por instituição —
-- ex. "Policlínica Francisco Martins da Silva" usa o texto da Secretaria
-- Municipal de Saúde / IGH, em vez do texto padrão de neurofisiologia
-- clínica. Uma linha por linha; quando vazio, o app usa o texto fixo
-- padrão (ver SERVICE_LINES em src/components/laudo-shell.tsx).

alter table public.institutions
  add column header_lines text;
