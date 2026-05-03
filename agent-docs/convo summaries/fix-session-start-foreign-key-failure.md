# Fix session start foreign key failure

Summary:
- `session:start` could fail with `SQLITE_CONSTRAINT_FOREIGNKEY` when the saved `classId` in local preferences pointed to a class row that no longer existed in SQLite.
- The main-process session path now validates the class record before inserting a session.
- If the class row is missing, it rebuilds the class profile from the session payload and uses the repaired `classId` for the new session and saved current-session state.

How to run:
```powershell
npm run dev
```

Then start a session from the home screen. If an older local class folder had a stale backend `classId`, the app now recreates the missing class row automatically instead of failing.
