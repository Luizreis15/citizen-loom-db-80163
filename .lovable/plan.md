

## Quiz de Onboarding (Typebot-style) -- Plano de Implementacao em Fases

Este e um modulo completamente novo e independente do onboarding de clientes existente. O expert acessa o quiz sem login, apenas com um token unico. A v1 nao tera IA integrada (apenas export e prompt copiavel). A implementacao sera em 4 fases incrementais.

---

### Fase 1 -- Banco de dados + Quiz basico funcional

**Objetivo:** Expert consegue abrir o link, responder perguntas e salvar respostas.

**1.1 Novas tabelas (migration SQL)**

- `expert_onboardings` -- registro principal do quiz
  - id (uuid, PK)
  - token (text, unique, 64 chars)
  - expert_name (text)
  - expert_email (text)
  - expert_whatsapp (text, nullable)
  - project_name (text, nullable)
  - internal_notes (text, nullable)
  - status (text: 'created', 'sent', 'in_progress', 'completed')
  - consent_accepted (boolean, default false)
  - consent_at (timestamptz, nullable)
  - current_block (integer, default 0)
  - expires_at (timestamptz)
  - completed_at (timestamptz, nullable)
  - created_by (uuid, ref profiles.id)
  - created_at, updated_at (timestamptz)

- `expert_onboarding_responses` -- respostas do quiz
  - id (uuid, PK)
  - onboarding_id (uuid, FK expert_onboardings.id)
  - block_id (text) -- ex: "bloco_1", "bloco_2"
  - field_key (text) -- ex: "nome_completo", "fase_atual"
  - value (text) -- resposta (texto ou JSON para multi-select)
  - created_at, updated_at (timestamptz)
  - UNIQUE(onboarding_id, field_key)

**RLS Policies:**
- `expert_onboardings`: Admins/Owners podem tudo. Acesso publico SELECT/UPDATE apenas para tokens validos (nao expirados, nao completos).
- `expert_onboarding_responses`: Admins/Owners podem tudo. INSERT/UPDATE/SELECT publico vinculado a token valido via onboarding_id.

**1.2 Schema das perguntas (hardcoded no frontend)**

As ~37 perguntas serao definidas como constante TypeScript (nao no banco). Cada pergunta define:
- key, label, type (single-select, multi-select, text, textarea, email, url, phone)
- options (para selects)
- required (boolean)
- showWhen (logica condicional)
- block (agrupamento)

**1.3 Pagina publica do Quiz: `/quiz/:token`**

- Componente `ExpertQuiz.tsx` -- pagina principal
- Componente `QuizChatBubble.tsx` -- mensagem estilo conversa (bolha)
- Componente `QuizInput.tsx` -- input adaptativo (botoes, chips, texto)
- Componente `QuizProgress.tsx` -- barra de progresso

**Fluxo UX (estilo Typebot):**
1. Busca onboarding pelo token (sem autenticacao)
2. Se expirado ou concluido: tela de erro/sucesso
3. Tela de boas-vindas + checkbox LGPD
4. Perguntas aparecem uma a uma em formato de chat
5. Resposta do expert aparece como bolha alinhada a direita
6. Proxima pergunta aparece com animacao suave
7. Auto-save a cada resposta (upsert no banco)
8. Se fechar e reabrir: retoma do ponto onde parou
9. Tela final com confirmacao + CTA opcional (link Calendly configuravel)

**Rota no App.tsx:** Rota publica (fora do AuthLayout), sem ProtectedRoute.

---

### Fase 2 -- Painel Admin (criar, listar, gerenciar)

**2.1 Pagina `/admin/expert-quiz` -- Listagem**
- Tabela com: nome, email, projeto, status, data, acoes
- Filtros por status
- Busca por nome/email

**2.2 Dialog "Novo Onboarding"**
- Campos: nome, email, whatsapp, projeto, observacoes
- Gera token unico (crypto.randomUUID + base64)
- Define expiracao (padrao 30 dias)
- Salva no banco com status 'created'

**2.3 Pagina `/admin/expert-quiz/:id` -- Detalhe**
- Respostas formatadas por bloco
- Informacoes do expert
- Status e timeline
- Botoes: Copiar link, Reenviar email

---

### Fase 3 -- Email automatico + Exportacao

**3.1 Edge Function `send-expert-quiz-invite`**
- Usa Resend (ja configurado)
- Template com: saudacao, link do quiz, tempo estimado, suporte
- Chamada pelo admin ao criar ou clicar "Reenviar"
- Atualiza status para 'sent'

**3.2 Exportacao no admin**
- Botao "Exportar CSV" -- colunas snake_case com todas respostas
- Botao "Exportar JSON" -- estrutura hierarquica por blocos
- Botao "Copiar Prompt" -- monta texto padrao com contexto + respostas em JSON para colar no ChatGPT

---

### Fase 4 -- Melhorias e polish

- Validacoes avancadas (email, URL, telefone)
- Animacoes de transicao entre perguntas
- Mobile-first refinements
- Registro de consentimento LGPD com timestamp
- Metricas (tempo medio de preenchimento)

---

### Detalhes tecnicos

**Estrutura de arquivos novos:**

```text
src/
  pages/
    ExpertQuiz.tsx              -- pagina publica do quiz
    admin/
      ExpertQuizList.tsx        -- listagem admin
      ExpertQuizDetail.tsx      -- detalhe admin
  components/
    expert-quiz/
      QuizChatBubble.tsx        -- bolha de mensagem
      QuizInput.tsx             -- inputs adaptativos
      QuizProgress.tsx          -- barra de progresso
      QuizWelcome.tsx           -- tela inicial
      QuizComplete.tsx          -- tela final
      quizSchema.ts             -- definicao das perguntas
  
supabase/
  functions/
    send-expert-quiz-invite/
      index.ts
```

**Primeira entrega (Fase 1) inclui:**
- Migration SQL criando tabelas + RLS
- Schema das perguntas (constante TS)
- Pagina do quiz conversacional funcional
- Rota publica no App.tsx
- Auto-save e retomada

**O que NAO sera feito na v1:**
- Integracao com IA/OpenAI
- Pagamento/checkout
- CRM avancado
- Automacao multietapas
