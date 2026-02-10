
# Fix: Previous answer showing on next question

## Problem
When advancing to the next question in the quiz, the input field still shows the previous answer. This happens because React reuses the same `QuizQuestion` component instance -- the `useState(defaultValue)` only runs on initial mount, not when props change.

## Solution
Add a `key={currentQuestion.key}` prop to the `QuizQuestionComponent` in `ExpertQuiz.tsx`. This forces React to destroy and recreate the component when the question changes, resetting all internal state (text input value, selected options).

## Technical Details

**File:** `src/pages/ExpertQuiz.tsx`

Change the `QuizQuestionComponent` render to include a `key` prop:

```tsx
<QuizQuestionComponent
  key={currentQuestion.key}   // <-- add this line
  question={currentQuestion}
  questionNumber={currentIdx + 1}
  defaultValue={answers[currentQuestion.key]}
  onAnswer={(val) => handleAnswer(currentQuestion.key, currentQuestion.block, val)}
  onBack={currentIdx > 0 ? handleBack : undefined}
/>
```

This is a one-line fix. No other files need to change.
