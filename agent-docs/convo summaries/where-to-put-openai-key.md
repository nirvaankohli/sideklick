## Summary

Confirmed that the local backend expects `OPENAI_API_KEY` from a repo-root `.env` file. The `.env` file is already ignored by git, so local secrets should be placed there.

## How To Run

Create a file named `.env` in the repository root with:

```env
OPENAI_API_KEY=your_key_here
```

Optional:

```env
OPENAI_MODEL=gpt-5-mini
```

Then start the app with:

```powershell
npm start
```
