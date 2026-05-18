# Cram Mode Embedded Quiz Titles

## Summary
The request was clarified to target Cram Mode's auto-generated quizzes specifically: when cram tasks prebuild quizzes in the background, the model should return short, descriptive names for those quizzes so the saved entries look clean and meaningful in the file manager.

## Implementation
I updated the quiz-generation flow for auto-generated cram quizzes:

- Added an optional `titleHint` field to the quiz request schema and types in both backend service stacks.
- Updated `src/home.js` so `buildSavedQuizForCramTask` sends a cram-specific title hint based on the task topic/title when it requests an auto-generated quiz.
- Updated the quiz-generation prompt in both service entry points so, when `titleHint` is present, the model uses that as saved-title direction and keeps the result short and specific.
- Added regression coverage in `tests/backend.quiz.test.js` and `tests/cram-mode.test.js`.

## Architecture Impact
This slightly extends the quiz request contract by adding optional title guidance, but it does not change the quiz response shape or file-manager storage model.

It makes the cram auto-generation path more intentional:

- cram-generated quizzes can ask for a file-manager-friendly title explicitly
- saved quiz entries still use the model's returned `quiz.title`
- regular quiz generation remains compatible because `titleHint` is optional
