
## Redesign Premium -- Paleta Escura, Dourado e Grafite

Transformar o quiz de um visual claro/roxo infantilizado para um design premium escuro, elegante e profissional com tons de dourado e grafite.

---

### Nova Paleta de Cores

| Elemento | Atual | Novo |
|---|---|---|
| Fundo principal | Branco com leve roxo | Grafite escuro (#1a1a2e / #16213e) |
| Cor de destaque | Roxo #7c3aed | Dourado #c9a84c / #d4af37 |
| Texto principal | Escuro | Branco/creme claro #f5f0e8 |
| Texto secundario | Cinza medio | Cinza claro #9ca3af |
| Bordas/cards | Cinza claro | Grafite medio #2a2a3e com borda dourada sutil |
| Botoes | Roxo solido | Gradiente dourado com hover elegante |
| Progresso | Barra roxa | Gradiente dourado |
| Inputs | Borda cinza | Borda grafite com focus dourado |

### Tipografia Premium

- Remover emojis (sem 👋 e 🎉)
- Usar font-weight mais leve nos titulos (semibold em vez de bold)
- Tracking mais aberto (letter-spacing) nos labels e subtitulos
- Textos em caixa alta nos labels de bloco com espacamento elegante

---

### Arquivos modificados (apenas visual, sem logica)

**1. `src/pages/ExpertQuiz.tsx`**
- Fundo: `bg-[#1a1a2e]` com gradiente sutil para `#16213e`
- Spinner loading: dourado em vez de roxo
- Tela de erro: fundo escuro, texto claro
- Header: logo com fundo escuro, contador em dourado
- Textos: cor `text-white` / `text-gray-400`

**2. `src/components/expert-quiz/QuizWelcome.tsx`**
- Fundo escuro com gradiente grafite
- Card com `bg-[#2a2a3e]/80` backdrop-blur e borda dourada sutil
- Titulo sem emoji, tipografia elegante (tracking wide, semibold)
- Badges com fundo dourado/grafite em vez de roxo/verde
- Checkbox LGPD com accent dourado
- Botao CTA com gradiente dourado `from-[#c9a84c] to-[#d4af37]`
- Texto em tons claros/creme

**3. `src/components/expert-quiz/QuizQuestion.tsx`**
- Numero da questao: fundo dourado sutil em vez de roxo
- Label do bloco: dourado com tracking wide
- Opcoes de selecao: borda grafite, hover com borda dourada, selecionado com fundo dourado
- Letras (A, B, C): borda dourada quando selecionado
- Inputs de texto: fundo transparente, borda grafite, focus dourado
- Botoes OK: gradiente dourado
- Links Voltar/Pular: texto cinza claro, hover dourado
- Textos brancos/creme

**4. `src/components/expert-quiz/QuizProgress.tsx`**
- Barra de fundo: grafite escuro
- Preenchimento: gradiente dourado `from-[#c9a84c] to-[#d4af37]`

**5. `src/components/expert-quiz/QuizComplete.tsx`**
- Fundo escuro grafite
- Icone de sucesso: dourado em vez de verde
- Titulo sem emoji, tipografia premium
- Botao de agendamento: borda dourada
- Texto creme/branco

---

### Resultado esperado

Uma experiencia visual sofisticada e profissional: fundo escuro grafite, acentos dourados, tipografia limpa sem emojis, bordas sutis, gradientes elegantes -- transmitindo premium e confianca.
