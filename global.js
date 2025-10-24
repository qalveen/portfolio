// Lab 3 — Step 1: boot + helper
console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: Automatic navigation menu (data + build)
// ──────────────────────────────────────────────────────────────────────────────
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "CV" }, // or "Resume"
  { url: "https://github.com/qalveen", title: "GitHub" },
];

// Correct base for local dev vs GitHub Pages
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/"; // ← your repo name

// Create <nav> and insert at the top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// Build links
for (const p of pages) {
  let url = p.url;
  if (!url.startsWith("http")) url = BASE_PATH + url;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  // External links open in new tab
  if (a.host !== location.host) a.target = "_blank";

  nav.append(a);
}

// ──────────────────────────────────────────────────────────────────────────────
/* Step 2: Automatic current page link (EXACTLY as the lab requires)
   - Use $$ to select nav links
   - Use Array.find() to match host + pathname
   - Add 'current' class via classList.add (with optional chaining) */
const navLinks = $$("nav a");
const currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add("current");

// ──────────────────────────────────────────────────────────────────────────────
// Step 4: Dark-mode switch (adds the control and sets `color-scheme`)
// ──────────────────────────────────────────────────────────────────────────────
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);

const select = document.getElementById("theme");

// Set from storage (or default to Automatic)
const saved = localStorage.colorScheme ?? "light dark";
applyColorScheme(saved);
select.value = saved;

// Persist + apply on change
select.addEventListener("input", (e) => {
  const value = e.target.value;
  localStorage.colorScheme = value;
  applyColorScheme(value);
});

// Actually set the CSS color-scheme on <html>
function applyColorScheme(value) {
  document.documentElement.style.setProperty("color-scheme", value);
}

// ──────────────────────────────────────────────
// Step 5: Better Contact Form (optional)
// ──────────────────────────────────────────────
const form = document.querySelector("form");

form?.addEventListener("submit", (event) => {
  event.preventDefault(); // Stop normal submission

  // Collect all form data
  const data = new FormData(form);
  let url = form.action + "?"; // Start building the mailto link
  const params = [];

  // Build properly encoded query parameters
  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  url += params.join("&");
  location.href = url; // Open the email client with the encoded URL
});

// ─────────────────────────────────────────────
// Step 1.2: Load project data from JSON
// ─────────────────────────────────────────────
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log(response); // To inspect the response in the console

    // Check if the response is OK (status code 200–299)
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // Parse the response body as JSON
    const data = await response.json();

    // Return the parsed data
    return data;

  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
  }
}

window.fetchJSON = fetchJSON;
