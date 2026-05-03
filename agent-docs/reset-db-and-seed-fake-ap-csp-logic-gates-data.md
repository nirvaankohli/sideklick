## What changed

- Wiped the local SQLite app data and replaced it with a fake `AP CSP` class.
- Seeded 3 fake sessions about logic gates:
  - `Logic Gates Foundations`
  - `Combining Gates and Boolean Expressions`
  - `De Morgan and Circuit Simplification`
- Seeded matching interactions and 2 gap records so assist context, strengths, and gaps have realistic material to work from.
- Replaced the live app preferences session explorer data so the fake class and sessions show up in the home UI.

## Files touched

- `big-red-hacks.sqlite`
- `scripts/seed-fake-ap-csp-data.js`
- `C:\\Users\\nirva\\AppData\\Roaming\\big-red-hacks-overlay\\preferences.json`

## Validation

- Ran the Electron seed script successfully.
- Verified the real preferences file now contains the seeded `AP CSP` class and 3 logic-gates sessions.
