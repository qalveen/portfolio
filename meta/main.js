import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import scrollama from "https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm";

// ---------------- LOAD DATA ----------------

async function loadData() {
  const data = await d3.csv("./loc.csv", (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    datetime: new Date(row.datetime),
  }));
  return data;
}

// ---------------- PROCESS COMMITS ----------------

function processCommits(data) {
  return d3.groups(data, (d) => d.commit)
    .map(([id, lines]) => {
      const d0 = lines[0];
      const dt = new Date(d0.datetime);
      return {
        id,
        datetime: dt,
        hourFrac: dt.getHours() + dt.getMinutes() / 60,
        url: `https://github.com/qalveen/portfolio/commit/${id}`,
        totalLines: lines.length,
        lines,
      };
    })
    .sort((a, b) => d3.ascending(a.datetime, b.datetime));
}

// ---------------- SUMMARY STATS ----------------

function renderSummary(data, commits) {
  const container = d3.select("#summary");
  container.selectAll("*").remove();

  const dl = container.append("dl").attr("class", "stats");

  const stats = [
    ["COMMITS", commits.length],
    ["FILES", d3.groups(data, d => d.file).length],
    ["TOTAL LOC", data.length],
    ["MAX DEPTH", d3.max(data, d => d.depth)],
    ["LONGEST LINE", d3.max(data, d => d.length)],
    ["MAX LINES", d3.max(commits, d => d.totalLines)],
  ];

  stats.forEach(([label, value]) => {
    dl.append("dt").text(label);
    dl.append("dd").text(value);
  });
}

// ---------------- SCATTERPLOT ----------------

let xScale, yScale;

function renderScatter(commits) {
  const width = 800, height = 450;
  const margin = { top: 10, right: 40, bottom: 30, left: 50 };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([margin.left, width - margin.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, "0")}:00`));

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d")));

  svg.append("g").attr("class", "dots");

  updateScatter(commits, null);
}

function updateScatter(commits, activeCommit) {
  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commits, d => d.totalLines))
    .range([4, 18]);

  const svg = d3.select("#chart svg");

  svg.select(".dots")
    .selectAll("circle")
    .data(commits, d => d.id)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => rScale(d.totalLines))
    .attr("fill", d => d === activeCommit ? "red" : "steelblue")
    .attr("opacity", d => d === activeCommit ? 1 : 0.5);
}

// ---------------- FILE VIS ----------------

function updateFiles(commits) {
  const lines = commits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const container = d3.select("#files")
    .selectAll("div")
    .data(files, d => d.name)
    .join(enter =>
      enter.append("div").call((div) => {
        div.append("dt").append("code");
        div.append("dd");
      })
    );

  container.select("dt > code")
    .text(d => `${d.name} (${d.lines.length})`);

  container.select("dd")
    .selectAll("div")
    .data(d => d.lines)
    .join("div")
    .attr("class", "loc");
}

// ---------------- STORY TEXT ----------------

function buildStory(commits) {
  d3.select("#scatter-story")
    .selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html(d => `
      On ${d.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })},
      I made <a href="${d.url}" target="_blank">a glorious commit</a>
      editing ${d.totalLines} lines.
    `);
}

// ---------------- SCROLLER ----------------

function initScroller(commits) {
  const scroller = scrollama();

  scroller.setup({
    container: "#scrolly-1",
    step: "#scatter-story .step",
  })
  .onStepEnter(res => {
    const commit = res.element.__data__;
    const idx = commits.indexOf(commit);
    const visible = commits.slice(0, idx + 1);
    updateScatter(visible, commit);
    updateFiles(visible);
    renderSummary(data, visible);
  });
}

// ---------------- RUN ----------------

let data, commits;

data = await loadData();
commits = processCommits(data);

renderSummary(data, commits);
renderScatter(commits);
updateFiles(commits);
buildStory(commits);
initScroller(commits);
