import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

//
// ---------------------------- STEP 1 — LOAD DATA ----------------------------
//
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

//
// ---------------------------- STEP 1.2 — COMMITS ----------------------------
//
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let obj = {
        id: commit,
        url: `https://github.com/qalveen/portfolio/commit/${commit}`,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(obj, "lines", {
        value: lines,
        enumerable: false,
      });

      return obj;
    });
}

//
// ---------------------------- STEP 1.3 — SUMMARY STATS ----------------------
//
function renderCommitInfo(data, commits) {
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

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

//
// ---------------------------- STEP 3 — TOOLTIP FUNCTIONS --------------------
//
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

function updateTooltipVisibility(isVisible) {
  document.getElementById("commit-tooltip").hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX + 12}px`;
  tooltip.style.top = `${event.clientY + 12}px`;
}

//
// ---------------------------- STEP 5 — BRUSH HELPER -------------------------
//
let xScale, yScale; // must be global for brushing

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function renderSelectionCount(selection, commits) {
  const selected = selection ? commits.filter((d) => isCommitSelected(selection, d)) : [];
  const element = document.querySelector("#selection-count");

  element.textContent = `${selected.length || "No"} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits) {
  const selected = selection ? commits.filter((d) => isCommitSelected(selection, d)) : [];

  const container = document.getElementById("language-breakdown");
  if (selected.length === 0) {
    container.innerHTML = "";
    return;
  }

  const lines = selected.flatMap((d) => d.lines);
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = "";
  for (const [lang, count] of breakdown) {
    const pct = d3.format(".1~%")(count / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${count} lines (${pct})</dd>`;
  }
}

//
// ---------------------------- STEP 2–5 SCATTERPLOT --------------------------
//
function renderScatterPlot(data, commits) {
  const width = 700;
  const height = 450;
  const margin = { top: 10, right: 10, bottom: 25, left: 40 };

  const usableArea = {
    left: margin.left,
    top: margin.top,
    right: width - margin.right,
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
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // radius scale ⭐
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 18]);

  // gridlines FIRST
  svg.append("g")
    .attr("transform", `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .tickFormat("")
        .tickSize(-usableArea.width)
    )
    .attr("class", "gridlines");

  // sort so small dots stay on top
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const dots = svg.append("g").attr("class", "dots");

  dots.selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .style("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", (event, commit) => {
      updateTooltipPosition(event);
      updateTooltipVisibility(true);
      renderTooltipContent(commit);
      d3.select(event.currentTarget).style("fill-opacity", 1);
    })
    .on("mouseleave", (event) => {
      updateTooltipVisibility(false);
      d3.select(event.currentTarget).style("fill-opacity", 0.7);
    });

  // axes
  svg.append("g")
    .attr("transform", `translate(${usableArea.left},0)`)
    .call(
      d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00")
    );

  svg.append("g")
    .attr("transform", `translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(8));

  //
  // ---- STEP 5 — ADD BRUSHING ----
  //
  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on("start brush end", (event) => {
      const selection = event.selection;
      d3.selectAll("circle").classed("selected", (d) => isCommitSelected(selection, d));
      renderSelectionCount(selection, commits);
      renderLanguageBreakdown(selection, commits);
    });

  svg.call(brush);
  svg.selectAll(".dots, .overlay ~ *").raise(); // tooltip fix
}

//
// ---------------------------- RUN ALL ----------------------------
let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
