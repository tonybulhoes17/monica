-- exams tinha políticas de RLS pra select/insert/update, mas nenhuma pra
-- delete — sem uma policy de delete, um DELETE roda "com sucesso" porém
-- filtra zero linhas (RLS não gera erro, só restringe quais linhas a
-- operação enxerga), então a exclusão de exame nunca tinha efeito nenhum
-- no banco. Mesmo padrão das outras policies desta tabela: separação fina
-- de permissão (só admin pode excluir) fica na camada de aplicação
-- (requireAdmin() em deleteExam(), ver src/app/(app)/laudos/[examId]/actions.ts),
-- não na RLS.
create policy "equipe autenticada exclui laudos"
  on public.exams for delete
  using (auth.uid() is not null);
