# Cram Mode Embedded Quiz Titles

## Summary
The request was to improve Cram Mode's embedded quiz generation so the model produces quiz titles that are short, sweet, and clearly define what the quiz covers, then commit the change once tests pass.

## Implementation
I updated the quiz-generation system instructions in both quiz service entry points:

- `backend/src/services/quiz.ts`
- `src/main/server/services/quiz.ts`

The prompt now explicitly tells the model to write a short, specific quiz title that clearly tells the student what is inside. This keeps the change focused on generation behavior, which is what drives the saved embedded quiz names used in Cram Mode.

I also added a regression assertion in `tests/backend.quiz.test.js` so this instruction stays in place.

## Architecture Impact
This does not change the request or response contract, storage shape, or quiz rendering flow.

It slightly strengthens the prompt contract between the app and the quiz model:

- embedded cram quizzes should come back with more descriptive titles
- saved quiz names continue to derive from the generated quiz title
- no new UI or persistence logic was required
