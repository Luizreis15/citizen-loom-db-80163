

## Envio Automatico de Email com Link do Quiz

Quando o admin criar um novo quiz no painel, o sistema envia automaticamente um email premium para o expert com o link do questionario.

---

### Arquivos a criar

**1. `supabase/functions/send-expert-quiz-invite/index.ts`** -- Edge function de envio

- Recebe: `expert_name`, `expert_email`, `quiz_link`, `project_name` (opcional), `expires_in_days`
- Usa Resend com `from: "Digital Hera <noreply@digitalhera.com.br>"`
- Email HTML premium com paleta escura/dourada matching o design do quiz:
  - Header com gradiente grafite e logo Digital Hera
  - Saudacao personalizada com nome do expert
  - Texto explicando o diagnostico digital
  - Botao CTA dourado com link do quiz
  - Info de validade do link
  - Footer elegante
- CORS headers padrao
- Secrets necessarios: `RESEND_API_KEY` (ja configurado)

**2. `supabase/config.toml`** -- Adicionar configuracao

- Adicionar `[functions.send-expert-quiz-invite]` com `verify_jwt = true`

---

### Arquivos a modificar

**3. `src/pages/admin/AdminExpertQuiz.tsx`** -- Chamar edge function apos criar quiz

- No `createMutation`, apos inserir na tabela com sucesso, invocar a edge function `send-expert-quiz-invite` passando nome, email, link do quiz e dias de validade
- Atualizar toast de sucesso para "Quiz criado e email enviado!"
- Em caso de erro no envio do email (mas quiz criado), mostrar toast informando que o quiz foi criado mas o email falhou, com opcao de copiar o link manualmente
- Adicionar botao de reenvio de email na tabela (icone Mail) para quizzes ja criados

---

### Detalhes tecnicos

- A edge function segue o mesmo padrao de `send-welcome-client` (Resend + CORS + validacao)
- O link do quiz e construido como `{APP_URL}/quiz/{token}` usando o secret APP_URL
- O email HTML usa inline styles com a paleta premium (grafite #1a1a2e, dourado #c9a84c, creme #f5f0e8)
- Nenhuma migracao de banco necessaria
- O JWT do admin autenticado e usado para autorizar a chamada da edge function

