# Improve gap prompting and save stopped sessions into class folders

Summary:
- Updated the OpenAI prompt and context guidance so student self-doubt is treated as stronger evidence of a likely gap.
- Review-oriented requests now explicitly prioritize relevant past gaps.
- Fixed the home folder tree so session children are no longer discarded on load.
- Stopping a session now writes a named session item back into the class folder and notifies the home window immediately.

How to run:
```powershell
npm run dev
```

Test flow:
- Start a class session
- Ask something uncertain like "I don't really know this" or ask for review
- Stop the session
- Go back to the class folder on Home
- The stopped session should appear as a saved session item with its name
