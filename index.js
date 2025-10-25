import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

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
