# Laudos de EEG — Dra. Monica Seixas

Plataforma interna (não comercializada) para cadastro de pacientes e emissão
de laudos de eletroencefalograma. Stack: Next.js (App Router) + Supabase
(Postgres + Auth + Storage) + Vercel.

## Papéis

- **Admin** (Dra. Monica): cria contas de secretárias, cadastra instituições,
  escolhe modelo e redige/edita laudos, assina, vê o painel do dia.
- **Secretária**: lança pacientes e exames (dados cadastrais), não assina.

## Fluxo principal

1. Secretária cadastra paciente + exame em **Novo paciente**: dados do
   paciente, data do exame, médico solicitante, comorbidades/medicações (só
   para referência da Dra. Monica, não entram no laudo impresso) e a
   **instituição** onde o exame foi feito (define a logo do cabeçalho). Busca
   automática por CPF se o paciente já tiver exames anteriores — todos os
   exames de todas as vezes ficam registrados, vinculados ao mesmo paciente.
2. No **Painel**, Dra. Monica vê a lista de eletros do dia (com seletor de
   data) e clica em **Fazer laudo**.
3. Escolhe um modelo pré-cadastrado → o texto do modelo entra em formulário
   editável (negrito, itálico, sublinhado, títulos, listas, alinhamento),
   dentro do mesmo layout do documento final (cabeçalho com logo, caixa de
   dados do paciente, corpo do laudo, carimbo/assinatura).
4. **Assinar laudo** → grava a assinatura (ver seção Vidas abaixo). Editar um
   laudo assinado mostra um aviso e, ao confirmar, remove a assinatura e volta
   o status para "em edição" — **não há histórico de versões anteriores**,
   apenas a versão atual (decisão do produto).
5. Botões **Imprimir** (abre a visualização e chama a impressão do navegador)
   e **Baixar PDF** (gera PDF no servidor, idêntico ao layout da tela) sempre
   disponíveis.
6. **Salvar como modelo**: qualquer laudo em edição pode virar um novo modelo
   padrão — basta dar um nome. Fica disponível para qualquer paciente dali em
   diante (gerenciável em **Modelos de laudo**).

## Modelos de laudo

Já vem com o primeiro modelo real cadastrado via seed
(`supabase/migrations/0003_seed_template_vigilia_sono_adulto.sql`): **Vigília
e Sono Adulto**, baseado no exemplo enviado pela Dra. Monica. O corpo do
modelo contém só o texto clínico (título, condições técnicas, achados,
conclusão, impressão) — nome/idade/datas/solicitante **não** entram no texto
do modelo porque já são preenchidos automaticamente a partir do cadastro do
exame, na caixa de dados do paciente (ver `src/components/laudo-shell.tsx`).

Se quiser cadastrar manualmente outros modelos com marcadores, também há
suporte a `{{nome_paciente}}`, `{{idade}}`, `{{data_nascimento}}`,
`{{data_exame}}`, `{{medico_solicitante}}`, `{{comorbidades}}`,
`{{medicacoes}}` (ver `src/lib/template.ts`) — mas como esses dados já
aparecem na caixa acima do corpo do laudo, normalmente não é necessário
repeti-los no texto.

Há outros PDFs de exemplo com nomes parecidos na pasta Downloads do usuário
(`vigilia e sonolencia adulto.pdf`, `sono e atividade generalizada adulto.pdf`,
`vigilia normal crianca.pdf`, `vigilia e sono normal 18 meses.pdf`) — ainda
não foram transformados em modelos; avisar se for para cadastrá-los também.

## Instituições

Cada instituição (`admin/instituicoes`) tem nome + logo (upload direto para o
Storage do Supabase, bucket público `institution-logos`). A logo escolhida no
cadastro do exame aparece no cabeçalho do laudo daquele exame. Existe uma
instituição padrão pré-cadastrada ("Dra. Monica Seixas") usando a logo local
em `public/branding/logo.png`.

**Assumi** que o texto fixo ao lado da logo ("NEUROFISIOLOGIA CLÍNICA /
ELETROENCEFALOGRAMA DIGITAL (EEG) / VÍDEO-ELETROENCEFALOGRAMA (VÍDEO-EEG)") é
igual para qualquer instituição — só a logo muda. Se isso estiver errado (se
esse texto também devia variar por instituição), avisar para eu mover esse
campo para a tabela `institutions`.

## Branding (já incorporado)

- `public/branding/logo.png` — logo enviada (monograma MS).
- `public/branding/assinatura.jpg` — assinatura enviada, usada no
  canto inferior direito do laudo (junto com o carimbo de texto
  nome/especialidade/CRM, exatamente como no exemplo).
- Carimbo de texto: nome, especialidade e `CRMBA 28539 RQE 19407` fixos em
  `src/components/laudo-shell.tsx` (`DOCTOR_NAME`, `DOCTOR_SPECIALTY`,
  `NEXT_PUBLIC_DOCTOR_CRM`).

## Integração com o Vidas (assinatura digital)

Ainda não há credenciais da API do Vidas. O módulo
`src/lib/signing/vidas.ts` é o único ponto de integração: hoje ele **simula**
a assinatura (sem validade jurídica real, só para testar o fluxo completo) e
mostra "assinatura simulada" no rodapé do laudo. Quando as credenciais
(`VIDAS_API_BASE_URL`, `VIDAS_API_CLIENT_ID`, `VIDAS_API_CLIENT_SECRET` no
`.env`) chegarem, implementar a chamada real dentro da função `signDocument`
— o resto do app não precisa mudar.

## Setup

### 1. Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor**, rode, nesta ordem, o conteúdo de:
   - `supabase/migrations/0001_init.sql` (tabelas `profiles`, `patients`,
     `report_templates`, `exams` e RLS)
   - `supabase/migrations/0002_institutions.sql` (tabela `institutions`,
     bucket de Storage para logos, coluna `exams.institution_id`)
   - `supabase/migrations/0003_seed_template_vigilia_sono_adulto.sql`
     (primeiro modelo de laudo pronto)
3. Em **Project Settings → API**, copie `URL`, `anon public key` e
   `service_role key`.
4. Crie o primeiro usuário admin (Dra. Monica): em **Authentication → Users**,
   clique em "Add user", crie com e-mail/senha, depois rode no SQL Editor:

   ```sql
   insert into public.profiles (id, full_name, role, crm, rqe)
   values ('<uuid do usuário criado>', 'Monica Seixas', 'admin', 'CRMBA 28539', 'RQE 19407');
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
      admin/instituicoes/       admin: cadastro de instituições + upload de logo
    (print)/laudos/[examId]/imprimir/   visualização de impressão (sem menu)
    api/admin/secretarias/      criação de usuário via Supabase Admin API
    api/laudos/[examId]/pdf/    geração de PDF (Puppeteer)
  components/
    rich-text-editor.tsx        editor de texto rico (Tiptap) com toolbar
    laudo-shell.tsx              layout visual do laudo (cabeçalho/caixa de
                                  dados/corpo/carimbo), igual ao exemplo
    confirm-dialog.tsx / prompt-dialog.tsx
  lib/
    supabase/                   clients (browser/server/admin) + middleware
    signing/vidas.ts            ponto único de integração com o Vidas
    pdf.ts                      geração de PDF via Chromium headless
    template.ts                 merge de placeholders do modelo
    age.ts / cpf.ts             helpers
supabase/migrations/
  0001_init.sql
  0002_institutions.sql
  0003_seed_template_vigilia_sono_adulto.sql
```
