-- Campo de endereço por instituição (aparece pequeno/discreto no rodapé do
-- laudo) + permite excluir uma instituição sem travar por causa de exames
-- já vinculados a ela: a FK passa a ser "on delete set null", então excluir
-- a instituição só limpa `exams.institution_id` (o exame não é apagado,
-- fica apenas "sem instituição").

alter table public.institutions
  add column address text;

alter table public.exams
  drop constraint exams_institution_id_fkey;

alter table public.exams
  add constraint exams_institution_id_fkey
  foreign key (institution_id) references public.institutions (id)
  on delete set null;
