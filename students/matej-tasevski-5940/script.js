
const DATA_URL = "./doctor-who-episodes-full.json"; // local file

let episodes = [];
let filtered = [];
let sortState = { field: "rank", dir: 1 }; // 1 asc, -1 desc

document.addEventListener("DOMContentLoaded", async () => {
  setStatus("Loading…");
  try {
    const res = await fetch(DATA_URL);
    const data = await res.json();
    episodes = data;
    filtered = episodes.slice();
    initSorting();
    initFiltering();
    render();
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load data", true);
  }
});

function setStatus(msg, isError = false) {
  const status = document.getElementById("status");
  const text = status.querySelector(".status-text");
  const spinner = status.querySelector(".spinner");

  text.textContent = msg;
  status.classList.toggle("error", !!isError);

  if (msg.toLowerCase().includes("loading")) {
    status.classList.add("loading");
  } else {
    status.classList.remove("loading");
  }
}


function initSorting() {
  document.querySelectorAll("#episodesTable thead th").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.field;
      if (!field) return;
      if (sortState.field === field) {
        sortState.dir *= -1; // toggle
      } else {
        sortState.field = field;
        sortState.dir = 1;
      }
      render();
      updateSortIndicators();
    });
  });
  updateSortIndicators();
}

function updateSortIndicators() {
  document.querySelectorAll("#episodesTable thead th").forEach(th => {
    const field = th.dataset.field;
    th.classList.remove("asc","desc");
    if (field === sortState.field) {
      th.classList.add(sortState.dir === 1 ? "asc" : "desc");
    }
  });
}

function initFiltering() {
  const search = document.getElementById("searchInput");
  const modernOnly = document.getElementById("modernOnly");
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    filtered = episodes.filter(ep => {
      const titleOk = !q || ep.title.toLowerCase().includes(q);
      const eraOk = !modernOnly.checked || (ep.era !== "Classic");
      return titleOk && eraOk;
    });
    render();
  };
  search.addEventListener("input", apply);
  modernOnly.addEventListener("change", apply);
}

function render() {
  // sort copy of filtered
  const items = filtered.slice().sort((a, b) => compare(a, b, sortState.field) * sortState.dir);
  const tbody = document.querySelector("#episodesTable tbody");
  tbody.innerHTML = "";
  const tpl = document.getElementById("rowTemplate");

  for (const ep of items) {
    const row = tpl.content.cloneNode(true);
    row.querySelector(".rank").textContent = ep.rank;
    row.querySelector(".title").textContent = ep.title;
    row.querySelector(".series").textContent = ep.series;
    row.querySelector(".era").textContent = ep.era;
    row.querySelector(".year").textContent = ep.broadcastYear;
    row.querySelector(".director").textContent = ep.director;
    row.querySelector(".writer").textContent = ep.writer;
    row.querySelector(".doctor").textContent = ep.doctor;
    row.querySelector(".companion").textContent = ep.companion;
    row.querySelector(".cast").textContent = ep.castCount;
    tbody.appendChild(row);
  }
}

function compare(a, b, field) {
  const va = a[field];
  const vb = b[field];
  if (typeof va === "number" && typeof vb === "number") {
    return va - vb;
  }
  // fallback: case-insensitive string compare
  return String(va).toLowerCase().localeCompare(String(vb).toLowerCase());
}
