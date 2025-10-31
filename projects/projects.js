import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// ─────────── FETCH PROJECT DATA ───────────
const projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
const searchInput = document.querySelector(".searchBar");

document.querySelector(".projects-title").textContent = `${projects.length} Projects`;


// ─────────── SHARED FILTER STATE ───────────
let query = "";          // search text
let selectedIndex = -1;  // pie slice index ( -1 = none selected )


// ✅ Centralized filtering — THIS FIXES THE PITFALL
function applyFilters() {
  let filtered = projects;

  // search filter
  if (query.trim() !== "") {
    filtered = filtered.filter((project) => {
      let values = Object.values(project).join("\n").toLowerCase();
      return values.includes(query.toLowerCase());
    });
  }

  // year (pie) filter
  if (selectedIndex !== -1 && currentPieData[selectedIndex]) {
    let selectedYear = currentPieData[selectedIndex].label;
    filtered = filtered.filter((p) => p.year.toString() === selectedYear);
  }

  // ✅ If search returns 0 projects → reset pie selection
  if (filtered.length === 0) {
    selectedIndex = -1;          // remove pie filter
    filtered = projects;         // show all projects again
  }

  renderProjects(filtered, projectsContainer, "h2");
  renderPieChart(filtered);
}



// ─────────── PIE CHART + LEGEND FUNCTION ───────────
let currentPieData = [];  // <-- new global

function renderPieChart(projectList) {
  const svg = d3.select("#projects-pie-plot");
  const legend = d3.select(".legend");

  svg.selectAll("path").remove();
  legend.selectAll("li").remove();

  const rolledData = d3.rollups(
    projectList,
    (v) => v.length,
    (d) => d.year
  );

  currentPieData = rolledData.map(([year, count]) => ({
    label: year,
    value: count,
  }));

  const sliceGen = d3.pie().value((d) => d.value);
  const arcGen = d3.arc().innerRadius(0).outerRadius(50);
  const arcData = sliceGen(currentPieData);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcData.forEach((arc, i) => {
    svg.append("path")
      .attr("d", arcGen(arc))
      .attr("fill", colors(i))
      .attr("class", selectedIndex === i ? "selected" : "")
      .on("click", () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        applyFilters();   // ✅ change this line
      });
  });

  currentPieData.forEach((d, idx) => {
    legend.append("li")
      .attr("class", `legend-item ${selectedIndex === idx ? "selected" : ""}`)
      .attr("style", `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;
        applyFilters();   // ✅ same change here
      });
  });
}



// ─────────── SEARCH EVENT (uses same filtering pipeline) ───────────
searchInput.addEventListener("input", (event) => {
  query = event.target.value.toLowerCase();
  applyFilters(); // ✅ USE SHARED FILTER PIPELINE
});


// initial render
applyFilters();
