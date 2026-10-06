# Laudos de EEG — Dra. Monica Seixas

Plataforma interna (não comercializada) para cadastro de pacientes e emissão
de laudos de eletroencefalograma. Stack: Next.js (App Router) + Supabase
(Postgres + Auth + Storage) + Vercel.

## Papéis

- **Admin** (Dra. Monica): cria contas de secretárias, escolhe modelo e
  redige/edita laudos, assina, vê o painel do dia.
- **Secretária**: lança pacientes e exames (dados cadastrais), não assina.

## Fluxo principal

1. Secretária cadastra paciente + exame em **Novo paciente** (busca
   automática por CPF se o paciente já tiver exames anteriores — todos os
   exames de todas as vezes ficam registrados, vinculados ao mesmo paciente).
2. No **Painel**, Dra. Monica vê a lista de eletros do dia (com seletor de
   data) e clica em **Fazer laudo**.
3. Escolhe um modelo pré-cadastrado → o texto do modelo entra já preenchido
   com os dados do paciente (nome, idade, data do exame, médico solicitante,
   comorbidades, medicações) em formulário editável (negrito, itálico,
   sublinhado, títulos, listas, alinhamento).
4. **Assinar laudo** → grava a assinatura (ver seção Vidas abaixo). Editar um
   laudo assinado mostra um aviso e, ao confirmar, remove a assinatura e volta
   o status para "em edição" — **não há histórico de versões anteriores**,
   apenas a versão atual (decisão do produto).
5. Botões **Imprimir** (abre a visualização e chama a impressão do navegador)
   e **Baixar PDF** (gera PDF no servidor, idêntico ao layout da tela) sempre
   disponíveis.

## Pendências de conteúdo/assets (fornecidos pela Dra. Monica)

- Modelos de laudo (texto): cadastrar em **Modelos de laudo** (admin). Já tem
  suporte a marcadores `{{nome_paciente}}`, `{{idade}}`, `{{data_nascimento}}`,
  `{{data_exame}}`, `{{medico_solicitante}}`, `{{comorbidades}}`,
  `{{medicacoes}}` — ver `src/lib/template.ts`.
- Logo da clínica, carimbo (CRM/RQE) e imagem da assinatura: hoje
  `src/components/laudo-shell.tsx` usa placeholders tracejados e as variáveis
  `NEXT_PUBLIC_CLINIC_NAME` / `NEXT_PUBLIC_DOCTOR_CRM`. Quando os arquivos/
  dados chegarem, trocar os placeholders pelas imagens reais (colocar em
  `public/branding/`) e os textos do carimbo.
- Layout exato do laudo (exemplo que a Dra. Monica vai enviar): o layout
  atual em `LaudoShell` é um ponto de partida razoável — ajustar
  cabeçalho/rodapé/tabela de dados para bater com o exemplo quando chegar.

## Integração com o Vidas (assinatura digital)

Ainda não há credenciais da API do Vidas. O módulo
`src/lib/signing/vidas.ts` é o único ponto de integração: hoje ele **simula**
a assinatura (sem validade jurídica real, só para testar o fluxo completo).
Quando as credenciais (`VIDAS_API_BASE_URL`, `VIDAS_API_CLIENT_ID`,
`VIDAS_API_CLIENT_SECRET` no `.env`) chegarem, implementar a chamada real
dentro da função `signDocument` — o resto do app não precisa mudar.

## Setup

### 1. Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, rode o conteúdo de
   `supabase/migrations/0001_init.sql` (cria tabelas `profiles`, `patients`,
   `report_templates`, `exams` e as policies de RLS).
3. Em **Project Settings → API**, copie `URL`, `anon public key` e
   `service_role key`.
4. Crie o primeiro usuário admin (Dra. Monica): em **Authentication → Users**,
   clique em "Add user", crie com e-mail/senha, depois rode no SQL Editor:

   ```sql
   insert into public.profiles (id, full_name, role, crm, rqe)
   values ('<uuid do usuário criado>', 'Monica Seixas', 'admin', '<CRM>', '<RQE>');
   ```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — vai redirecionar para `/login`.

### 4. Deploy (Vercel)

1. Suba este repositório para o GitHub.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de `.env.example` em
   **Project Settings → Environment Variables**.
4. Deploy.

A geração de PDF usa `@sparticuz/chromium-min` em produção (baixa um
Chromium leve compatível com funções serverless da Vercel) e `puppeteer`
completo em desenvolvimento local. Se a versão do pacote
`@sparticuz/chromium-min` for atualizada, confira se a URL do "pack" em
`src/lib/pdf.ts` ainda aponta para uma release compatível em
https://github.com/Sparticuz/chromium/releases.

## Estrutura

```
src/
  app/
    login/                      tela de login
    (app)/                      área autenticada (com menu)
      dashboard/                lista de eletros do dia + seletor de data
      pacientes/novo/           cadastro de paciente + exame (secretária)
      laudos/[examId]/          escolha de modelo → editor do laudo
      admin/secretarias/        admin: criar acesso de secretárias
      admin/modelos/            admin: CRUD dos modelos de laudo
    (print)/laudos/[examId]/imprimir/   visualização de impressão (sem menu)
    api/admin/secretarias/      criação de usuário via Supabase Admin API
    api/laudos/[examId]/pdf/    geração de PDF (Puppeteer)
  components/
    rich-text-editor.tsx        editor de texto rico (Tiptap) com toolbar
    laudo-shell.tsx              layout visual do laudo (cabeçalho/rodapé)
    confirm-dialog.tsx
  lib/
    supabase/                   clients (browser/server/admin) + middleware
    signing/vidas.ts            ponto único de integração com o Vidas
    pdf.ts                      geração de PDF via Chromium headless
    template.ts                 merge de placeholders do modelo
    age.ts / cpf.ts             helpers
supabase/migrations/0001_init.sql
```
