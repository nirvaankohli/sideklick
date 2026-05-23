# Request: Merge `website` into `main`, tag `v1.0.0`, push, then switch to `nirvaan`

## Summary
User requested a git workflow on the repository:
1. Merge branch `website` into `main`.
2. Create the release tag `v1.0.0`.
3. Push the updated branch and tag.
4. Switch the working branch to `nirvaan`.

## Implementation
- Stashed unrelated local work from the `website` checkout so the branch switch and merge stayed clean.
- Fast-forwarded local `main` to `origin/main` first because `main` was behind by one commit.
- Merged `website` into `main`, producing a merge commit with the current website changes.
- Recorded this request in `agent-docs` as part of the repo's agent documentation workflow.
- The release tag name used is `v1.0.0`, which matches the repo's tag-triggered release workflow pattern (`v*.*.*`).

## Architecture Impact
- No application architecture changes were introduced by the git operations themselves.
- The merge does bring the `website` branch's product and packaging changes into `main`, so the repository's mainline now reflects the website work plus the current release workflow update.
