import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const profileStats = document.querySelector('#profile-stats');


// Fetch all projects from the JSON file
const projects = await fetchJSON('./lib/projects.json');

// Take only the first three projects
const latestProjects = projects.slice(0, 3);

// Select the container where these will appear
const projectsContainer = document.querySelector('.projects');

// Render the projects dynamically
renderProjects(latestProjects, projectsContainer, 'h2');

// ─────────────────────────────────────────────
// Step 3: Fetch GitHub API data
// ─────────────────────────────────────────────
const githubData = await fetchGitHubData('qalveen');
console.log(githubData);

if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}

/* ===== META PAGE STAT COMPACT FIX ===== */
body.meta #stats .stats {
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem; /* reduces vertical spacing */
  max-width: 900px;
  margin: 0 auto;
}

body.meta #stats .stats dt {
  font-size: 0.6rem; /* smaller label */
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.5;
  margin-bottom: 0.1rem;
}

body.meta #stats .stats dd {
  font-size: 1.8rem !important;   /* <-- THIS makes the numbers smaller */
  font-weight: 700;
  margin-bottom: 0.5rem;
}

