

## Painel Admin para Quiz de Experts

Criar a rota `/admin/expert-quiz` com duas paginas: listagem de quizzes e visualizacao de respostas, seguindo o padrao existente em `AdminOnboarding.tsx` e `AdminOnboardingDetail.tsx`.

---

### Arquivos a criar

**1. `src/pages/admin/AdminExpertQuiz.tsx`** -- Pagina de listagem

- Buscar todos os registros de `expert_onboardings` (ordenados por `created_at DESC`)
- Cards de estatisticas: Criados, Em Progresso, Concluidos, Total
- Filtros: busca por nome/email e filtro por status (`created`, `in_progress`, `completed`)
- Tabela com colunas: Nome do Expert, Email, Projeto, Status (badge), Progresso (current_block/10), Data, Acoes
- Acoes: Visualizar respostas (link para detail), Copiar link do quiz, Excluir
- Botao "Novo Quiz" para criar onboarding de expert (dialog com campos: nome, email, whatsapp, nome do projeto, notas internas, dias para expirar)
- Ao criar, gerar token UUID, calcular expires_at, inserir na tabela

**2. `src/pages/admin/AdminExpertQuizDetail.tsx`** -- Pagina de detalhes/respostas

- Buscar o `expert_onboarding` por ID + todas as `expert_onboarding_responses` associadas
- Header com dados do expert (nome, email, whatsapp, projeto, status, datas)
- Agrupar respostas por bloco usando `QUIZ_BLOCKS` do `quizSchema.ts`
- Para cada bloco, listar as perguntas com label e valor respondido
- Perguntas sem resposta marcadas como "Pendente"
- Barra de progresso por bloco
- Botao "Voltar" para `/admin/expert-quiz`

---

### Arquivos a modificar

**3. `src/components/AppSidebar.tsx`**
- Adicionar item de menu "Quiz Expert" com url `/admin/expert-quiz` e icone `FileQuestion` (ou `Sparkles`)

**4. `src/App.tsx`**
- Importar `AdminExpertQuiz` e `AdminExpertQuizDetail`
- Adicionar rotas protegidas (Owner/Admin):
  - `/admin/expert-quiz` -> `AdminExpertQuiz`
  - `/admin/expert-quiz/:id` -> `AdminExpertQuizDetail`

---

### Detalhes tecnicos

- Reutilizar `QUIZ_QUESTIONS` e `QUIZ_BLOCKS` do `quizSchema.ts` para mapear field_key -> label e agrupar por bloco
- Status badges: `created` = cinza, `in_progress` = amarelo, `completed` = verde
- Progresso calculado como `current_block / 10 * 100`
- Para criar novo quiz, gerar token com `crypto.randomUUID()` no frontend
- O link do quiz sera `{window.location.origin}/quiz/{token}`
- Dialog de criacao usa campos simples (Input + Textarea)
- Nenhuma migracao de banco necessaria -- tabelas `expert_onboardings` e `expert_onboarding_responses` ja existem com RLS adequada

