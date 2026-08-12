// Dev-Detective — minimal JS implementation
const searchForm = document.getElementById('searchForm');
const usernameInput = document.getElementById('usernameInput');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const toggleBattleBtn = document.getElementById('toggleBattle');
const battleForm = document.getElementById('battleForm');
const userAInput = document.getElementById('userA');
const userBInput = document.getElementById('userB');

toggleBattleBtn.addEventListener('click', () => {
  battleForm.classList.toggle('hidden');
});

// Optional: set a token here to increase rate limit (do NOT commit tokens)
const GITHUB_TOKEN = ''; // e.g. 'ghp_xxx'. Leave empty for unauthenticated requests.

// Helper: fetch JSON with basic error handling
async function fetchJson(url) {
  const headers = {};
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    try { err.body = await res.json(); } catch(e){}
    throw err;
  }
  return res.json();
}

function setStatusLoading(msg = 'Loading...') {
  statusEl.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${msg}`;
}

function clearStatus() { statusEl.textContent = ''; }

function showNotFound(username) {
  resultEl.innerHTML = `<div class="profile-card"><div class="card-body"><div class="name">User Not Found: ${username}</div><div class="meta">Please check the username and try again.</div></div></div>`;
}

// Date formatting utility: "25 Jan 2023"
function formatDate(iso) {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString('en', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return iso;
  }
}

function renderProfile(user) {
  const avatar = user.avatar_url || '';
  const name = user.name || user.login;
  const bio = user.bio || '';
  const joinDate = user.created_at ? formatDate(user.created_at) : '';
  const portfolio = user.blog ? `<a href="${escapeHtml(user.blog)}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.blog)}</a>` : '—';

  return `
    <div class="profile-card">
      <div class="avatar"><img src="${avatar}" alt="${escapeHtml(name)}'s avatar" /></div>
      <div class="card-body">
        <div class="profile-meta">
          <div>
            <div class="name">${escapeHtml(name)}</div>
            <div class="small meta">@${escapeHtml(user.login)}</div>
          </div>
        </div>
        <div class="bio">${escapeHtml(bio)}</div>
        <div class="meta">Joined: ${joinDate} • Portfolio: ${portfolio}</div>
      </div>
    </div>
  `;
}

function renderReposList(repos) {
  if (!repos || repos.length === 0) return `<div class="repos"><div class="small meta">No public repos.</div></div>`;
  const items = repos.map(r => {
    const date = r.updated_at ? formatDate(r.updated_at) : '';
    return `<li class="repo-item">
      <a href="${r.html_url}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)}</a>
      <div class="repo-date">${date}</div>
    </li>`;
  }).join('');
  return `<div class="repos"><h3>Top 5 Latest Repositories</h3><ul class="repo-list">${items}</ul></div>`;
}

// Basic HTML escaper
function escapeHtml(str='') {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

// Primary search handler
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;
  resultEl.innerHTML = '';
  clearStatus();
  setStatusLoading(`Fetching ${username}...`);
  try {
    const user = await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`);
    // render profile immediately
    resultEl.innerHTML = renderProfile(user);
    // fetch repos using repos_url; request up to 100 to get more for star totals later
    try {
      const repos = await fetchJson(`${user.repos_url}?per_page=100`);
      // sort by updated_at desc and take top 5
      repos.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
      const top5 = repos.slice(0,5);
      resultEl.innerHTML += renderReposList(top5);
    } catch (rerr) {
      // If repos fail, show profile but note repos error
      resultEl.innerHTML += `<div class="small meta">Could not load repositories.</div>`;
    }
  } catch (err) {
    if (err.status === 404) {
      showNotFound(username);
    } else {
      resultEl.innerHTML = `<div class="profile-card"><div class="card-body"><div class="name">Error</div><div class="meta">${escapeHtml(err.message || 'Unknown error')}</div></div></div>`;
    }
  } finally {
    clearStatus();
  }
});

// Battle mode: query two users concurrently and compare total stars
battleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const a = userAInput.value.trim(); const b = userBInput.value.trim();
  if (!a || !b) return;
  resultEl.innerHTML = '';
  setStatusLoading('Fetching both users...');
  try {
    // Fetch both users in parallel
    const users = await Promise.all([
      fetchJson(`https://api.github.com/users/${encodeURIComponent(a)}`),
      fetchJson(`https://api.github.com/users/${encodeURIComponent(b)}`)
    ]);

    // For each user, fetch repos (parallel)
    const reposFetches = users.map(u => fetchJson(`${u.repos_url}?per_page=100`).catch(()=>[]));
    const reposArrays = await Promise.all(reposFetches);

    // Total stars
    const totals = reposArrays.map(arr => arr.reduce((s,r)=> s + (r.stargazers_count||0), 0));

    // Determine winner/loser
    let idxWinner = 0;
    if (totals[1] > totals[0]) idxWinner = 1;
    // If tie, treat first as winner (could be adjusted)
    const winner = users[idxWinner];
    const loser = users[1 - idxWinner];

    // Render two cards side-by-side with green/red
    resultEl.innerHTML = `
      <div class="result-grid">
        <div class="profile-card ${idxWinner===0 ? 'winner' : 'loser'}">
          <div class="avatar"><img src="${winner.avatar_url}" alt="${escapeHtml(winner.login)}" /></div>
          <div class="card-body">
            <div class="card-title">Winner</div>
            <div class="name">${escapeHtml(winner.name || winner.login)} <span class="small">@${escapeHtml(winner.login)}</span></div>
            <div class="small">Total Stars: <strong class="stat">${totals[idxWinner]}</strong></div>
            <div class="small">Public repos: ${winner.public_repos}</div>
          </div>
        </div>

        <div class="profile-card ${idxWinner===1 ? 'winner' : 'loser'}">
          <div class="avatar"><img src="${loser.avatar_url}" alt="${escapeHtml(loser.login)}" /></div>
          <div class="card-body">
            <div class="card-title">${idxWinner===1 ? 'Winner' : 'Loser'}</div>
            <div class="name">${escapeHtml(loser.name || loser.login)} <span class="small">@${escapeHtml(loser.login)}</span></div>
            <div class="small">Total Stars: <strong class="stat">${totals[1 - idxWinner]}</strong></div>
            <div class="small">Public repos: ${loser.public_repos}</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    if (err.status === 404) {
      resultEl.innerHTML = `<div class="profile-card"><div class="card-body"><div class="name">One or both users not found.</div></div></div>`;
    } else {
      resultEl.innerHTML = `<div class="profile-card"><div class="card-body"><div class="name">Error</div><div class="meta">${escapeHtml(err.message || 'Unknown error')}</div></div></div>`;
    }
  } finally {
    clearStatus();
  }
});
