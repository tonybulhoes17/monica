-- Integração real com o Vidas (VIDaaS - Certificado em Nuvem da Valid).
--
-- Guarda, por admin (só existe a Dra. Monica hoje, mas desenhado para
-- suportar mais de um médico no futuro), o access_token da sessão de
-- assinatura (scope signature_session) criptografado em repouso, com
-- validade (expires_at). Enquanto a sessão estiver válida, assinar um
-- laudo não exige escanear o QR code de novo.

create table public.vidas_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  access_token_encrypted text not null,
  certificate_alias text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index vidas_sessions_profile_id_key on public.vidas_sessions (profile_id);

alter table public.vidas_sessions enable row level security;

create policy "admin gerencia sua sessao vidas"
  on public.vidas_sessions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Guarda o caminho do PDF efetivamente assinado pelo Vidas (PAdES) no
-- Storage privado — é esse arquivo (não uma reconstrução em HTML) que deve
-- ser servido como o laudo oficial assinado.
alter table public.exams
  add column signed_pdf_path text;

-- Bucket privado (ao contrário de institution-logos, que é público): o PDF
-- assinado só pode ser lido via rota autenticada do servidor.
insert into storage.buckets (id, name, public)
values ('signed-laudos', 'signed-laudos', false)
on conflict (id) do nothing;

create policy "admin le laudos assinados no storage"
  on storage.objects for select
  using (bucket_id = 'signed-laudos' and public.is_admin());

create policy "admin grava laudos assinados no storage"
  on storage.objects for insert
  with check (bucket_id = 'signed-laudos' and public.is_admin());

create policy "admin atualiza laudos assinados no storage"
  on storage.objects for update
  using (bucket_id = 'signed-laudos' and public.is_admin());
