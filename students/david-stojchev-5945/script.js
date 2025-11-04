// Configuration
const CONFIG = {
  DATA_URL:
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-full.json",
  FILTER_DEBOUNCE_MS: 250,
};

// State Management
let state = {
  episodes: [],
  filtered: [],
  sort: [{ field: "rank", ascending: true }],
  filters: {
    name: "",
    era: "all",
    doctor: "all",
  },
  warnings: [],
  collapsedDecades: new Set(),
};

// DOM cache
const refs = {};

// ---------------------- Initialization ----------------------
document.addEventListener("DOMContentLoaded", init);

async function init() {
  refs.loading = document.getElementById("loading");
  refs.error = document.getElementById("error");
  refs.table = document.getElementById("episodes-table");
  refs.tbody = document.getElementById("episodes-body");
  refs.noResults = document.getElementById("no-results");
  refs.nameFilter = document.getElementById("name-filter");

  injectFilters();
  injectExportButton();
  injectWarningBadge();
  setupEventListeners();
  await loadEpisodes();
}

// ---------------------- UI Helpers ----------------------
function showLoading(show) {
  refs.loading.style.display = show ? "block" : "none";
  refs.table.style.display = show ? "none" : "table";
}

function showError(msg) {
  refs.error.textContent = msg || "";
  refs.error.style.display = msg ? "block" : "none";
}

function setWarningCount(n) {
  const badge = document.getElementById("warnings-badge");
  badge.textContent = n > 0 ? `Warnings: ${n}` : "";
  badge.style.display = n > 0 ? "inline-block" : "none";
}

function injectWarningBadge() {
  const header = document.querySelector("header h1");
  const badge = document.createElement("div");
  badge.id = "warnings-badge";
  badge.style.display = "none";
  badge.style.margin = "8px auto 0";
  badge.style.background = "#fff5f5";
  badge.style.border = "1px solid #f5c6cb";
  badge.style.color = "#721c24";
  badge.style.padding = "5px 10px";
  badge.style.borderRadius = "8px";
  badge.style.width = "fit-content";
  badge.style.fontSize = "0.9em";
  header.insertAdjacentElement("afterend", badge);
}

// ---------------------- Filters & Export ----------------------
function injectFilters() {
  const filterContainer = document.querySelector(".filters");

  // Era dropdown
  const eraGroup = document.createElement("div");
  eraGroup.className = "filter-group";
  eraGroup.innerHTML = `
    <label for="era-filter">Era:</label>
    <select id="era-filter">
      <option value="all">All Eras</option>
    </select>
  `;

  // Doctor dropdown
  const doctorGroup = document.createElement("div");
  doctorGroup.className = "filter-group";
  doctorGroup.innerHTML = `
    <label for="doctor-filter">Doctor:</label>
    <select id="doctor-filter">
      <option value="all">All Doctors</option>
    </select>
  `;

  filterContainer.appendChild(eraGroup);
  filterContainer.appendChild(doctorGroup);

  refs.eraFilter = document.getElementById("era-filter");
  refs.doctorFilter = document.getElementById("doctor-filter");
}

function injectExportButton() {
  const filterContainer = document.querySelector(".filters");
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export CSV";
  exportBtn.style.marginLeft = "10px";
  exportBtn.style.padding = "8px 14px";
  exportBtn.style.border = "none";
  exportBtn.style.background = "#2a5298";
  exportBtn.style.color = "white";
  exportBtn.style.borderRadius = "6px";
  exportBtn.style.cursor = "pointer";
  exportBtn.addEventListener("click", exportCSV);
  filterContainer.appendChild(exportBtn);
}

function exportCSV() {
  const rows = [
    [
      "Rank",
      "Title",
      "Series",
      "Era",
      "Broadcast Year",
      "Director",
      "Writer",
      "Doctor",
      "Companion",
      "Cast Count",
    ],
    ...state.filtered.map((ep) => [
      ep.rank,
      ep.title,
      ep.series ?? "",
      ep.era,
      ep._year ?? "",
      ep.director,
      Array.isArray(ep.writer) ? ep.writer.join("; ") : ep.writer,
      ep.doctor,
      ep.companion,
      ep.cast.length,
    ]),
  ];

  const csv = rows.map((r) =>
    r
      .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
      .join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "doctor_who_episodes.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------------------- Event Listeners ----------------------
function setupEventListeners() {
  const debouncedFilter = debounce(() => {
    state.filters.name = refs.nameFilter.value.trim();
    applyFilters();
  }, CONFIG.FILTER_DEBOUNCE_MS);

  refs.nameFilter.addEventListener("input", debouncedFilter);

  refs.eraFilter.addEventListener("change", () => {
    state.filters.era = refs.eraFilter.value;
    applyFilters();
  });

  refs.doctorFilter.addEventListener("change", () => {
    state.filters.doctor = refs.doctorFilter.value;
    applyFilters();
  });

  document.querySelectorAll("#episodes-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", (e) => {
      const field = th.dataset.sort;
      sortEpisodes(field, e.shiftKey);
    });
  });
}

// ---------------------- Data Loading ----------------------
async function loadEpisodes() {
  try {
    showError("");
    showLoading(true);

    const resp = await fetch(CONFIG.DATA_URL);
    if (!resp.ok) throw new Error(`Network error: ${resp.status}`);

    const raw = await resp.json();
    const data = Array.isArray(raw) ? raw : raw.episodes;
    if (!Array.isArray(data)) throw new Error("Fetched data is not an array");

    state.episodes = data.map((ep, i) => normalizeEpisode(ep, i));
    state.filtered = [...state.episodes];

    populateDropdowns();
    setWarningCount(state.warnings.length);
    sortEpisodes("rank");
  } catch (err) {
    showError("Failed to load episodes: " + err.message);
  } finally {
    showLoading(false);
  }
}

// ---------------------- Normalization ----------------------
function normalizeEpisode(raw, idx) {
  const ep = {
    rank: parseIntSafe(raw.rank, idx + 1),
    title: raw.title ?? `Untitled #${idx + 1}`,
    series: parseIntSafe(raw.series, null),
    era: raw.era ?? "Unknown",
    broadcast_date: raw.broadcast_date ?? null,
    director: raw.director ?? "—",
    writer: normalizeWriters(raw.writer),
    doctor: formatDoctor(raw.doctor),
    companion: formatCompanion(raw.companion),
    cast: Array.isArray(raw.cast) ? raw.cast : [],
  };

  const date = parseDate(ep.broadcast_date);
  ep._parsedDate = date;
  ep._year = date ? date.getFullYear() : null;
  return ep;
}

function parseIntSafe(val, fallback) {
  const n = parseInt(val);
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(value) {
  if (!value) return null;
  const d = Date.parse(value);
  if (!isNaN(d)) return new Date(d);
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(value);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

function normalizeWriters(w) {
  if (!w) return ["—"];
  if (Array.isArray(w)) return w.map((x) => x.trim());
  return w.split(/[,/&]/).map((x) => x.trim());
}

function formatDoctor(d) {
  if (!d) return "—";
  if (Array.isArray(d)) return d.map(formatDoctor).join(", ");
  if (typeof d === "object") {
    return `${d.actor || d.name || "Unknown"}${d.incarnation ? ` (${d.incarnation})` : ""}`;
  }
  return String(d);
}

function formatCompanion(c) {
  if (!c) return "—";
  if (Array.isArray(c)) return c.map(formatCompanion).join(", ");
  if (typeof c === "object") return `${c.actor || "Unknown"}${c.character ? ` (${c.character})` : ""}`;
  return String(c);
}

// ---------------------- Filtering ----------------------
function applyFilters() {
  const q = state.filters.name.toLowerCase();
  const era = state.filters.era;
  const doctor = state.filters.doctor;

  state.filtered = state.episodes.filter((ep) => {
    const matchName = !q || ep.title.toLowerCase().includes(q);
    const matchEra = era === "all" || ep.era.toLowerCase() === era.toLowerCase();
    const matchDoctor = doctor === "all" || ep.doctor.toLowerCase().includes(doctor.toLowerCase());
    return matchName && matchEra && matchDoctor;
  });

  applySort();
  displayEpisodes(state.filtered);
}

function populateDropdowns() {
  const eras = [...new Set(state.episodes.map((e) => e.era).filter(Boolean))].sort();
  const doctors = [...new Set(state.episodes.map((e) => e.doctor).filter((d) => d !== "—"))].sort();

  eras.forEach((era) => {
    const opt = document.createElement("option");
    opt.value = era;
    opt.textContent = era;
    refs.eraFilter.appendChild(opt);
  });

  doctors.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc;
    opt.textContent = doc;
    refs.doctorFilter.appendChild(opt);
  });
}

// ---------------------- Sorting ----------------------
function sortEpisodes(field, multi = false) {
  const existing = state.sort.find((s) => s.field === field);

  if (multi && existing) {
    existing.ascending = !existing.ascending;
  } else if (multi) {
    state.sort.push({ field, ascending: true });
  } else {
    if (existing) {
      existing.ascending = !existing.ascending;
      state.sort = [existing];
    } else {
      state.sort = [{ field, ascending: true }];
    }
  }

  updateSortIndicators();
  applySort();
  displayEpisodes(state.filtered);
}

function applySort() {
  const sorters = state.sort;
  state.filtered.sort((a, b) => {
    for (const { field, ascending } of sorters) {
      let va = a[field];
      let vb = b[field];

      if (field === "broadcast_date") {
        const da = a._parsedDate;
        const db = b._parsedDate;
        if (da && db) return (da - db) * (ascending ? 1 : -1);
        if (!da && db) return 1;
        if (da && !db) return -1;
      }

      if (va === null || va === undefined || va === "—") return 1;
      if (vb === null || vb === undefined || vb === "—") return -1;

      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * (ascending ? 1 : -1);

      const cmp = String(va).localeCompare(String(vb));
      if (cmp !== 0) return cmp * (ascending ? 1 : -1);
    }
    return 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll("#episodes-table th").forEach((th) =>
    th.classList.remove("sort-asc", "sort-desc")
  );
  state.sort.forEach(({ field, ascending }) => {
    const th = document.querySelector(`#episodes-table th[data-sort="${field}"]`);
    if (th) th.classList.add(ascending ? "sort-asc" : "sort-desc");
  });
}

// ---------------------- Display (Decade Grouping) ----------------------
function displayEpisodes(list) {
  refs.tbody.innerHTML = "";
  if (!list.length) {
    refs.noResults.style.display = "block";
    refs.table.style.display = "none";
    return;
  }

  refs.noResults.style.display = "none";
  refs.table.style.display = "table";

  const frag = document.createDocumentFragment();

  // Group by decade
  const groups = {};
  list.forEach((ep) => {
    const decade = ep._year ? `${Math.floor(ep._year / 10) * 10}s` : "Unknown Decade";
    if (!groups[decade]) groups[decade] = [];
    groups[decade].push(ep);
  });

  Object.entries(groups).forEach(([decade, episodes]) => {
    const decadeRow = document.createElement("tr");
    decadeRow.className = "decade-row";
    const td = document.createElement("td");
    td.colSpan = 10;
    td.textContent = `${decade} (${episodes.length} episodes)`;
    td.style.background = "#f0f4ff";
    td.style.fontWeight = "bold";
    td.style.cursor = "pointer";
    td.addEventListener("click", () => {
      if (state.collapsedDecades.has(decade)) state.collapsedDecades.delete(decade);
      else state.collapsedDecades.add(decade);
      displayEpisodes(state.filtered);
    });
    decadeRow.appendChild(td);
    frag.appendChild(decadeRow);

    if (!state.collapsedDecades.has(decade)) {
      episodes.forEach((ep) => {
        const tr = document.createElement("tr");
        const createCell = (text) => {
          const td = document.createElement("td");
          td.textContent = text ?? "—";
          return td;
        };

        tr.append(
          createCell(ep.rank),
          createCell(ep.title),
          createCell(ep.series),
          createCell(ep.era),
          createCell(ep._year ?? "—"),
          createCell(ep.director),
          createCell(ep.writer.join(", ")),
          createCell(ep.doctor),
          createCell(ep.companion)
        );

        const castTd = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "cast-count";
        badge.textContent = ep.cast.length;
        castTd.appendChild(badge);
        tr.appendChild(castTd);
        frag.appendChild(tr);
      });
    }
  });

  refs.tbody.appendChild(frag);
}

// ---------------------- Utils ----------------------
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
