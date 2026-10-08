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
2. No **Painel**, qualquer usuário (admin ou secretária) vê a lista de
   eletros do dia, com filtro por data, por nome do paciente e por
   instituição. Dra. Monica clica em **Fazer laudo**; qualquer um dos dois
   papéis pode clicar em **Editar ficha** para corrigir dados de cadastro
   lançados errado (nome, CPF, datas, instituição, solicitante,
   comorbidades/medicações) — bloqueado para exames já assinados, para não
   divergir do PDF já assinado.
3. Escolhe um modelo pré-cadastrado → o texto do modelo entra em formulário
   editável (negrito, itálico, sublinhado, títulos, listas, alinhamento),
   dentro do mesmo layout do documento final (cabeçalho com logo, caixa de
   dados do paciente, corpo do laudo, carimbo/assinatura).
4. **Assinar laudo** → grava a assinatura (ver seção Vidas abaixo). Editar um
   laudo assinado mostra um aviso e, ao confirmar, remove a assinatura e volta
   o status para "em edição" — **não há histórico de versões anteriores**,
   apenas a versão atual (decisão do produto).
5. Na tela de **Fazer laudo**, Dra. Monica também pode corrigir a
   **instituição** do exame direto ali (select no topo, admin-only) — útil
   quando a secretária selecionou o local errado no lançamento. Bloqueado
   também para laudos já assinados.
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

Implementada seguindo o guia oficial de integração (OAuth PKCE + PAdES,
produto "Certificado em Nuvem" da Valid). Escolhido o escopo
`signature_session`: a Dra. Monica escaneia o QR code do Vidas **uma vez**
(sessão dura `VIDAAS_SESSION_LIFETIME_SECONDS`, padrão 12h) e assina quantos
laudos quiser nesse período, sem escanear de novo a cada laudo.

**Enquanto `VIDAAS_CLIENT_ID` / `VIDAAS_CLIENT_SECRET` /
`VIDAAS_SESSION_ENCRYPTION_KEY` não estiverem todos configurados**, o sistema
cai automaticamente no modo simulado (assina sem validade jurídica real, só
para testar o fluxo) — nenhuma mudança de código necessária para ligar o
modo real depois, só preencher as variáveis de ambiente.

Fluxo (ver `VIDAS_INTEGRATION_HANDOFF.md` nos Downloads para os detalhes do
contrato com a Valid):

1. Dra. Monica clica em **Assinar laudo**. Se não houver sessão Vidas ativa,
   é redirecionada para `/api/vidas/authorize`, que monta a URL de
   autorização (PKCE) e redireciona para o Vidas, que mostra o QR code.
2. Ela escaneia com o app do Vidas no celular. O Vidas redireciona de volta
   para `/api/vidas/callback`, que troca o `code` por um `access_token` e
   guarda criptografado (AES-256-GCM) em `vidas_sessions`, com validade.
3. De volta no editor, assinar agora funciona: o laudo é renderizado em PDF
   (mesmo pipeline do botão "Baixar PDF"), checado contra o limite de 7MB do
   Vidas, assinado via `POST /v0/oauth/signature`, e o PDF assinado (PAdES)
   é salvo no bucket privado `signed-laudos` — esse arquivo (não uma
   reconstrução em HTML) é o laudo oficial a partir daí; "Baixar PDF" passa a
   servir exatamente esses bytes.
4. A sessão expira sozinha (`expires_at`); expirando, o próximo "Assinar"
   redireciona para autorizar de novo.

**Pendente de credenciais reais da Valid para funcionar de verdade:**
- `VIDAAS_CLIENT_ID` / `VIDAAS_CLIENT_SECRET`: se a Dra. Monica ainda não tem
  uma aplicação registrada no PSC do Vidas, rodar
  `scripts/vidas-register-application.mjs` (documentado no próprio arquivo)
  com o e-mail dela e o redirect `https://laudos-eeg-monica.vercel.app/api/vidas/callback`.
- `VIDAAS_SESSION_ENCRYPTION_KEY`: gerar com `openssl rand -hex 32`.
- A Dra. Monica precisa ter um certificado em nuvem ativo junto à Valid
  (produto separado da integração em si — `POST /v0/oauth/user-discovery`
  confere isso, mas essa consulta ainda não está ligada à UI).

Módulos: `src/lib/vidas/` (cliente PSC, PKCE, criptografia, sessão) +
`src/lib/signing/vidas.ts` (orquestração: decide simulado vs. real) +
`src/app/api/vidas/{authorize,callback}` (rotas OAuth).

**Selo de assinatura no rodapé do laudo:** quando o laudo tem assinatura real
do Vidas (`signature_payload.provider === "vidas"`), o rodapé mostra um selo
verde "ASSINATURA ELETRÔNICA QUALIFICADA" (ícone de escudo, `src/components/laudo-shell.tsx`),
um parágrafo legal citando a MP 2.200-2/2001 e as Resoluções CFM 2.299/2021 e
2.381/2024, e um QR code de validação (`src/lib/qrcode.ts`, aponta para
`validar.iti.gov.br`) — além do bloco de nome/assinatura/CRM já existente. Se
a assinatura for simulada ou o laudo ainda não estiver assinado, o rodapé usa
o texto simples anterior. Esse selo é renderizado ao vivo (HTML), então só
aparece em laudos assinados a partir desta mudança; PDFs já assinados antes
dela mantêm os bytes originais no bucket `signed-laudos`.

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
   - `supabase/migrations/0004_seed_more_templates.sql` (mais 4 modelos)
   - `supabase/migrations/0005_fix_template_paragraph_spacing.sql`
   - `supabase/migrations/0006_fix_template_line_height.sql`
   - `supabase/migrations/0007_adjust_technical_block_line_height.sql`
   - `supabase/migrations/0008_fix_impressao_and_line_height.sql`
   - `supabase/migrations/0009_vidas_integration.sql` (tabela
     `vidas_sessions`, coluna `exams.signed_pdf_path`, bucket privado
     `signed-laudos`)
3. Em **Project Settings → API**, copie `URL`, `anon public key` e
   `service_role key` para o `.env.local` (ver passo 2 abaixo).
4. Crie o primeiro usuário admin (Dra. Monica) com o script
   `scripts/create-admin.mjs` (lê as chaves direto do `.env.local`, usa a
   Admin API do Supabase — não precisa criar manualmente pelo painel):

   ```bash
   node scripts/create-admin.mjs "email@exemplo.com" "senha-provisoria" "Monica Seixas" "CRMBA 28539" "RQE 19407"
   ```

   Para criar outro admin depois, é só rodar de novo com outro e-mail/senha.

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
    api/laudos/[examId]/pdf/    geração de PDF (Puppeteer) ou PDF assinado
    api/vidas/{authorize,callback}/   rotas OAuth do Vidas
  components/
    rich-text-editor.tsx        editor de texto rico (Tiptap) com toolbar
    laudo-shell.tsx              layout visual do laudo (cabeçalho/caixa de
                                  dados/corpo/carimbo), igual ao exemplo
    confirm-dialog.tsx / prompt-dialog.tsx
  lib/
    supabase/                   clients (browser/server/admin) + middleware
    signing/vidas.ts            orquestração: simulado vs. assinatura real
    vidas/                      cliente PSC, PKCE, criptografia, sessão
    pdf.ts                      geração de PDF via Chromium headless
    template.ts                 merge de placeholders do modelo
    age.ts / cpf.ts             helpers
scripts/
  create-admin.mjs                    cria usuário admin via Admin API
  vidas-register-application.mjs      registro único da app no PSC do Vidas
supabase/migrations/
  0001_init.sql … 0009_vidas_integration.sql
```
