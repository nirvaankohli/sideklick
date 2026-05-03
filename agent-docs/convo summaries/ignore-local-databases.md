## Summary

Updated `.gitignore` to ignore local database files and SQLite sidecar files so they stop cluttering the repository. This now covers the app's local database files such as `big-red-hacks.sqlite`, `big-red-hacks.sqlite-shm`, and `big-red-hacks.sqlite-wal`, along with broader `*.sqlite` and `*.db` patterns.

## How To Run

From the repo root, these files are now ignored by git:

```text
*.sqlite
*.sqlite-shm
*.sqlite-wal
*.db
*.db-shm
*.db-wal
big-red-hacks.sqlite
big-red-hacks.sqlite-shm
big-red-hacks.sqlite-wal
```

To verify:

```powershell
git status --short
```
