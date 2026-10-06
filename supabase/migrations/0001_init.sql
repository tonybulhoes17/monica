-- Plataforma de laudos de EEG — Dra. Monica Seixas
-- Schema inicial: perfis (admin/secretária), pacientes, modelos de laudo e exames/laudos.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: espelha auth.users, guarda o papel (role) de cada usuário.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'secretary')),
  crm text,
  rqe text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "usuário lê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid());

create policy "admin lê todos os perfis"
  on public.profiles for select
  using (public.is_admin());

create policy "admin gerencia perfis"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- patients: cadastro lançado pela secretária. CPF nunca aparece no laudo,
-- serve apenas para localizar exames anteriores do mesmo paciente.
-- ---------------------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  cpf text not null,
  birth_date date not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patients_cpf_idx on public.patients (cpf);

alter table public.patients enable row level security;

create policy "equipe autenticada lê pacientes"
  on public.patients for select
  using (auth.uid() is not null);

create policy "equipe autenticada cadastra pacientes"
  on public.patients for insert
  with check (auth.uid() is not null);

create policy "equipe autenticada atualiza pacientes"
  on public.patients for update
  using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- report_templates: padrões de laudo pré-existentes (enviados pela Dra. Monica).
-- ---------------------------------------------------------------------------
create table public.report_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content_html text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.report_templates enable row level security;

create policy "equipe autenticada lê modelos"
  on public.report_templates for select
  using (auth.uid() is not null);

create policy "admin gerencia modelos"
  on public.report_templates for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- exams: um laudo de EEG por exame. Um paciente pode ter vários exames.
-- status: pending (sem laudo iniciado) -> draft (em edição) -> signed (assinado).
-- Editar um laudo assinado deve voltar o status para draft e limpar a assinatura
-- (decisão do produto: não há histórico de versões, apenas a versão atual).
-- ---------------------------------------------------------------------------
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id),
  exam_date date not null,
  requesting_doctor text not null,
  comorbidities text,
  medications text,
  template_id uuid references public.report_templates (id),
  content_html text,
  status text not null default 'pending' check (status in ('pending', 'draft', 'signed')),
  signed_at timestamptz,
  signed_by uuid references public.profiles (id),
  signature_payload jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exams_exam_date_idx on public.exams (exam_date);
create index exams_patient_id_idx on public.exams (patient_id);

alter table public.exams enable row level security;

create policy "equipe autenticada lê laudos"
  on public.exams for select
  using (auth.uid() is not null);

create policy "equipe autenticada cadastra laudos"
  on public.exams for insert
  with check (auth.uid() is not null);

create policy "equipe autenticada atualiza laudos"
  on public.exams for update
  using (auth.uid() is not null);

-- A regra "só admin assina" é validada na camada de aplicação (API route),
-- não na RLS: as duas únicas contas do sistema são de equipe interna confiável
-- da própria clínica, então a separação fina de permissão fica no código,
-- evitando complexidade desproporcional no banco.
