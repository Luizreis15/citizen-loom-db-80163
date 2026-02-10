
## Redesign Visual do Quiz -- Mobile-first, Branding Digital Hera, Estilo Typebot

O quiz atual esta funcional mas visualmente sem identidade: fundo branco puro, sem logo, sem gradientes, sem personalidade. Vamos transformar todas as telas (Welcome, Quiz, Complete) em uma experiencia bonita, com a marca Digital Hera, mobile-first e visual estilo Typebot.

---

### O que muda

**1. Tela de Boas-vindas (QuizWelcome.tsx) -- Redesign completo**

- Fundo com gradiente sutil purple-to-white (cores da marca Digital Hera)
- Logo da Digital Hera no topo (usando `src/assets/logo-digital-hera.png`)
- Card centralizado com sombra suave e bordas arredondadas
- Icone decorativo ou ilustracao acima do titulo
- Tipografia maior e mais acolhedora no mobile
- Badges estilizados para "8-12 min" e "Dados protegidos" (com fundo colorido)
- Checkbox LGPD com melhor espacamento
- Botao CTA com gradiente purple, maior e mais chamativo
- Animacao de entrada suave (fade-in + slide-up)

**2. Tela do Quiz (ExpertQuiz.tsx) -- Visual Typebot**

- Header com logo Digital Hera pequeno + barra de progresso estilizada com cores da marca
- Fundo com gradiente sutil (nao branco puro)
- Bolhas de chat do "bot" com avatar pequeno (icone ou logo da Digital Hera)
- Bolhas do usuario com cor primary (purple)
- Separadores de bloco mais visuais (com icone + linha decorativa)
- Area de input com card estilizado e sombra
- Animacoes de digitacao ("...") antes de mostrar a pergunta

**3. Bolhas de Chat (QuizChatBubble.tsx) -- Estilo Typebot**

- Avatar circular ao lado da bolha do bot (logo Digital Hera ou icone roxo)
- Bolhas com bordas mais suaves e sombra leve
- Cores mais ricas (muted com tom levemente roxo em vez de cinza puro)
- Animacao de entrada com slide lateral + fade

**4. Barra de Progresso (QuizProgress.tsx) -- Mais visual**

- Progresso com gradiente purple-to-gold
- Texto com nome do bloco mais destacado
- Indicador numerico estilizado

**5. Tela Final (QuizComplete.tsx) -- Celebracao**

- Fundo com gradiente
- Logo da Digital Hera
- Icone de sucesso maior e animado
- Card de confirmacao com borda decorativa
- Botao de agendamento mais visivel

**6. Input Area (QuizInput.tsx) -- Polish**

- Botoes de selecao com bordas e hover mais coloridos (purple/gold)
- Botao de envio com gradiente
- Chips de multi-select mais bonitos

---

### Detalhes tecnicos

**Arquivos modificados:**
- `src/components/expert-quiz/QuizWelcome.tsx` -- redesign com logo, gradiente, card
- `src/components/expert-quiz/QuizChatBubble.tsx` -- avatar, sombra, animacoes
- `src/components/expert-quiz/QuizProgress.tsx` -- gradiente, visual melhor
- `src/components/expert-quiz/QuizComplete.tsx` -- celebracao, logo, gradiente
- `src/components/expert-quiz/QuizInput.tsx` -- botoes mais bonitos
- `src/pages/ExpertQuiz.tsx` -- fundo gradiente, header com logo, separadores visuais

**Assets utilizados:**
- `src/assets/logo-digital-hera.png` (logo ja existente no projeto)

**Nenhuma mudanca no banco de dados ou logica** -- apenas visual/CSS/componentes.
