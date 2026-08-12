# Dev-Detective

A small client-side application that searches GitHub users via the public GitHub REST API and renders a profile card with top repositories.

Features
- Search a single GitHub username and view profile details (avatar, name, bio, join date, portfolio).
- Loading indicator while requests are resolving.
- Clean "User Not Found" state for 404 responses.
- Fetches and displays the top 5 latest repositories (by updated_at).
- "Battle Mode": compare two users' total stars (uses Promise.all).

Files
- index.html — the app shell and UI
- styles.css — basic styling
- app.js — JavaScript using fetch + async/await

How to run
1. Open index.html in a browser (no build step required).
2. Try searching `octocat` to see example data.
3. Toggle Battle Mode and compare two usernames (e.g., `octocat` vs `torvalds`).

Notes
- Unauthenticated requests are rate-limited to 60 per hour per IP. To increase limits, set a personal access token in `app.js` by setting `GITHUB_TOKEN` (do NOT commit your token).
- Repo fetching uses `?per_page=100` — users with more than 100 public repos may require pagination to compute exact star totals.

License
MIT
