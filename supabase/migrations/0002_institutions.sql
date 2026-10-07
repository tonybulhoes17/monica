-- Cadastro de instituições: cada uma pode ter sua própria logo, usada no
-- cabeçalho do laudo conforme o local onde o exame foi realizado.

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.institutions enable row level security;

create policy "equipe autenticada lê instituições"
  on public.institutions for select
  using (auth.uid() is not null);

create policy "admin gerencia instituições"
  on public.institutions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Instituição padrão (consultório da própria Dra. Monica), usando a logo que
-- já fica embarcada no app em public/branding/logo.png. Pode ser renomeada
-- ou ter a logo trocada depois pela tela de administração.
insert into public.institutions (name, logo_url)
values ('Dra. Monica Seixas', '/branding/logo.png');

alter table public.exams
  add column institution_id uuid references public.institutions (id);

update public.exams
  set institution_id = (select id from public.institutions limit 1)
  where institution_id is null;

-- ---------------------------------------------------------------------------
-- Storage: bucket público para logos de instituição (upload feito pelo admin
-- diretamente do navegador).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('institution-logos', 'institution-logos', true)
on conflict (id) do nothing;

create policy "leitura pública das logos de instituição"
  on storage.objects for select
  using (bucket_id = 'institution-logos');

create policy "admin envia logos de instituição"
  on storage.objects for insert
  with check (bucket_id = 'institution-logos' and public.is_admin());

create policy "admin atualiza logos de instituição"
  on storage.objects for update
  using (bucket_id = 'institution-logos' and public.is_admin());

create policy "admin remove logos de instituição"
  on storage.objects for delete
  using (bucket_id = 'institution-logos' and public.is_admin());
