-- "Excluir" uma secretária não pode apagar o perfil de verdade: patients.created_by
-- e exams.created_by são "not null references profiles(id)" sem "on delete
-- set null" (ao contrário de institutions), então excluir a linha falharia
-- com violação de FK assim que a secretária tivesse qualquer paciente/exame
-- lançado — e mesmo que não falhasse, perderia quem lançou cada registro
-- antigo. Em vez disso, "excluir" desativa: marca active=false aqui e
-- bane o login no Supabase Auth (ver DELETE em
-- src/app/api/admin/secretarias/[id]/route.ts), sem tocar em nenhum
-- paciente/exame já existente.
alter table public.profiles
  add column active boolean not null default true;
