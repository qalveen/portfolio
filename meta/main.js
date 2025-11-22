import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

// ───────────────────────────────────────────────
// LOAD DATA
// ───────────────────────────────────────────────

async function loadData() {
  const data = await d3.csv("./loc.csv", (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// ───────────────────────────────────────────────
// PROCESS COMMITS
// ───────────────────────────────────────────────

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      let datetime = first.datetime;
      return {
        id: commit,
        url: `https://github.com/qalveen/portfolio/commit/${commit}`,
        author: first.author,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
        lines,
      };
    })
    .sort((a, b) => d3.ascending(a.datetime, b.datetime));
}

// ───────────────────────────────────────────────
// SUMMARY STATS
// ───────────────────────────────────────────────

function renderCommitInfo(data, commits) {
  const stats = d3.select("#stats");
  stats.selectAll("*").remove();

  const dl = stats.append("dl").attr("class", "stats");

  dl.append("dt").text("COMMITS");
  dl.append("dd").text(commits.length);

  dl.append("dt").text("FILES");
  dl.append("dd").text(d3.groups(data, (d) => d.file).length);

  dl.append("dt").text("TOTAL LOC");
  dl.append("dd").text(data.length);

  dl.append("dt").text("MAX DEPTH");
  dl.append("dd").text(d3.max(data, (d) => d.depth));

  dl.append("dt").text("LONGEST LINE");
  dl.append("dd").text(d3.max(data, (d) => d.length));

  dl.append("dt").text("MAX LINES");
  dl.append("dd").text(d3.max(commits, (d) => d.totalLines));
}

// ───────────────────────────────────────────────
// TOOLTIP
// ───────────────────────────────────────────────

function renderTooltipContent(commit) {
  document.getElementById("commit-link").href = commit.url;
  document.getElementById("commit-link").textContent = commit.id;
  document.getElementById("commit-date").textContent =
    commit.datetime.toLocaleString("en", {
      dateStyle: "full",
      timeStyle: "short",
    });
  document.getElementById("commit-author").textContent = commit.author;
  document.getElementById("commit-lines").textContent = commit.totalLines;
}

function updateTooltipVisibility(v) {
  document.getElementById("commit-tooltip").hidden = !v;
}

function updateTooltipPosition(evt) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${evt.clientX + 10}px`;
  tooltip.style.top = `${evt.clientY + 10}px`;
}

// ───────────────────────────────────────────────
// SCATTERPLOT
// ───────────────────────────────────────────────

let xScale, yScale;

function renderScatterPlot(commits) {
  const width = 750,
    height = 450;
  const margin = { top: 10, right: 40, bottom: 30, left: 50 };

  const usable = {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usable.left, usable.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usable.bottom, usable.top]);

  svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-usable.width).tickFormat(""));

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${usable.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat((d) => `${String(d).padStart(2, "0")}:00`));

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${usable.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")));

  svg.append("g").attr("class", "dots");

  updateScatterPlot(commits);
}

function updateScatterPlot(commits) {
  const svg = d3.select("#chart svg");
  if (!svg.node() || commits.length === 0) return;

  xScale.domain(d3.extent(commits, (d) => d.datetime)).nice();

  svg.select(".x-axis")
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")));

  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([4, 20]);

  svg.select("g.dots")
    .selectAll("circle")
    .data(commits, (d) => d.id)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .style("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (evt, commit) => {
      updateTooltipPosition(evt);
      updateTooltipVisibility(true);
      renderTooltipContent(commit);
      d3.select(evt.currentTarget).style("fill-opacity", 1);
    })
    .on("mouseleave", (evt) => {
      updateTooltipVisibility(false);
      d3.select(evt.currentTarget).style("fill-opacity", 0.7);
    });
}

// ───────────────────────────────────────────────
// FILE VISUALIZATION
// ───────────────────────────────────────────────

const colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(commits) {
  const lines = commits.flatMap((d) => d.lines);
  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines, type: lines[0]?.type }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3
    .select("#files")
    .selectAll("div")
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append("div").call((div) => {
        div.append("dt").append("code");
        div.append("dd");
      })
    );

  filesContainer.attr("style", (d) => `--color: ${colors(d.type || d.name)}`);

  filesContainer
    .select("dt > code")
    .html((d) => `${d.name}<small>${d.lines.length} lines</small>`);

  filesContainer
    .select("dd")
    .selectAll("div")
    .data((d) => d.lines)
    .join("div")
    .attr("class", "loc");
}

// ───────────────────────────────────────────────
// TIME FILTERING LOGIC
// ───────────────────────────────────────────────

let commitProgress = 100;
let commitMaxTime, filteredCommits, timeScale;
let commits, data;

function onTimeSliderChange(evt) {
  commitProgress = +evt.target.value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById("commit-time").textContent =
    commitMaxTime.toLocaleString("en", {
      dateStyle: "long",
      timeStyle: "short",
    });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(filteredCommits);
  renderCommitInfo(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

// ───────────────────────────────────────────────
// SCROLLY + STORY TEXT
// ───────────────────────────────────────────────

function buildStory(commits) {
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html(
      (d, i) => `
        On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })},
        I made <a href="${d.url}" target="_blank">${
          i === 0 ? "my first commit, and it was glorious" : "another glorious commit"
        }</a>.
        I edited ${d.totalLines} lines across ${
          d3.rollups(d.lines, (D) => D.length, (d) => d.file).length
        } files.
        Then I looked over all I had made, and I saw that it was very good.
      `
    );
}

// ───────────────────────────────────────────────
// SCROLL TRIGGER → UPDATE SCATTER
// ───────────────────────────────────────────────

function initScroller() {
  const scroller = scrollama();
  scroller
    .setup({
      container: "#scrolly-1",
      step: "#scatter-story .step",
    })
    .onStepEnter((response) => {
      const commit = response.element.__data__;
      updateScatterPlot([commit]); // highlight only current commit
    });
}

// ───────────────────────────────────────────────
// RUN
// ───────────────────────────────────────────────

data = await loadData();
commits = processCommits(data);

filteredCommits = commits;

timeScale = d3.scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, 100]);

commitMaxTime = timeScale.invert(commitProgress);

document.getElementById("commit-time").textContent =
  commitMaxTime.toLocaleString("en", {
    dateStyle: "long",
    timeStyle: "short",
  });

renderCommitInfo(data, commits);
renderScatterPlot(commits);
updateFileDisplay(commits);
buildStory(commits);
initScroller();

document
  .getElementById("commit-progress")
  .addEventListener("input", onTimeSliderChange);

  scroller.setup({
  container: "#scrolly-1",
  step: "#scatter-story .step",
});
