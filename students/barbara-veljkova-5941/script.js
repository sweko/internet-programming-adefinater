(() => {
  const dom = {
    filterTitle: document.getElementById("filter-title"),
    filterEra: document.getElementById("filter-era"),
    filterDoctor: document.getElementById("filter-doctor"),
    filterCompanion: document.getElementById("filter-companion"),
    exportCsv: document.getElementById("export-csv"),
    tbody: document.getElementById("episodes-body"),
    pageInfo: document.getElementById("page-info"),
    prev: document.getElementById("prev-page"),
    next: document.getElementById("next-page"),
  };

  let allEpisodes = [];
  let workingSet = [];
  let sortSpec = [{ key: "rank", dir: 1 }];
  let currentPage = 1;
  const pageSize = 50;

  const PART_URLS = [
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-01-10.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-11-20.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-21-30.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-31-40.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-41-50.json",
    "https://raw.githubusercontent.com/sweko/internet-programming-adefinater/refs/heads/preparation/data/doctor-who-episodes-51-65.json",
  ];

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return res.json();
  }

  async function loadData() {
    try {
      const parts = await Promise.all(PART_URLS.map(u => fetchJSON(u)));
      const merged = parts.flatMap(p => p.episodes || p || []);
      allEpisodes = merged.map(ep => ({
        ...ep,
        broadcast_year: parseYear(ep.broadcast_date),
        writer_display: formatWriter(ep.writer),
        doctor_display: formatDoctor(ep.doctor),
        companion_display: formatCompanion(ep.companion),
        cast_count: Array.isArray(ep.cast) ? ep.cast.length : 0
      }));
      populateFilters();
      workingSet = [...allEpisodes];
      renderTable();
    } catch {
      console.log("Failed to load data");
    }
  }

  function formatWriter(w) {
    if (!w) return "—";
    return w.split(/&|and/gi).map(s => s.trim()).join(", ");
  }

  function formatDoctor(d) {
    if (!d) return "—";
    return `${d.actor} (${d.incarnation})`;
  }

  function formatCompanion(c) {
    if (!c) return "—";
    return `${c.actor} (${c.character})`;
  }

  function parseYear(dateStr) {
    if (!dateStr) return "—";
    const m = dateStr.match(/\d{4}/);
    return m ? m[0] : "—";
  }

  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const rows = workingSet.slice(start, end);

    dom.tbody.innerHTML = rows
      .map(
        e => `<tr>
          <td>${e.rank}</td>
          <td>${e.title}</td>
          <td>${e.series}</td>
          <td>${e.era}</td>
          <td>${e.broadcast_year}</td>
          <td>${e.director}</td>
          <td>${e.writer_display}</td>
          <td>${e.doctor_display}</td>
          <td>${e.companion_display}</td>
          <td>${e.cast_count}</td>
        </tr>`
      )
      .join("");

    const totalPages = Math.ceil(workingSet.length / pageSize) || 1;
    dom.pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    dom.prev.disabled = currentPage <= 1;
    dom.next.disabled = currentPage >= totalPages;
  }

  function applyFilters() {
    const title = dom.filterTitle.value.toLowerCase();
    const era = dom.filterEra.value;
    const doc = dom.filterDoctor.value;
    const comp = dom.filterCompanion.value;

    workingSet = allEpisodes.filter(ep => {
      const matchTitle = !title || ep.title.toLowerCase().includes(title);
      const matchEra = !era || ep.era === era;
      const matchDoc = !doc || ep.doctor_display.includes(doc);
      const matchComp = !comp || (comp === "__NONE__" ? ep.companion_display === "—" : ep.companion_display.includes(comp));
      return matchTitle && matchEra && matchDoc && matchComp;
    });

    workingSet.sort(compare);
    currentPage = 1;
    renderTable();
  }

  function compare(a, b) {
    for (const s of sortSpec) {
      const av = a[s.key], bv = b[s.key];
      if (av < bv) return -1 * s.dir;
      if (av > bv) return 1 * s.dir;
    }
    return 0;
  }

  function toggleSort(key, multi = false) {
    if (!multi) {
      if (sortSpec[0].key === key) sortSpec[0].dir *= -1;
      else sortSpec = [{ key, dir: 1 }];
    } else {
      const ex = sortSpec.find(s => s.key === key);
      if (ex) ex.dir *= -1;
      else sortSpec.push({ key, dir: 1 });
    }
    applyFilters();
  }

  function populateFilters() {
    const docs = [...new Set(allEpisodes.map(e => e.doctor_display))].filter(d => d && d !== "—");
    dom.filterDoctor.innerHTML = `<option value="">All</option>` + docs.map(d => `<option value="${d}">${d}</option>`).join("");

    const comps = [...new Set(allEpisodes.map(e => e.companion_display))].filter(c => c && c !== "—");
    dom.filterCompanion.innerHTML =
      `<option value="">All</option><option value="__NONE__">None</option>` +
      comps.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  function exportCSV() {
    const header = ["Rank","Title","Series","Era","Year","Director","Writer","Doctor","Companion","Cast"];
    const rows = workingSet.map(e => [
      e.rank, e.title, e.series, e.era, e.broadcast_year, e.director,
      e.writer_display, e.doctor_display, e.companion_display, e.cast_count
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "episodes.csv";
    a.click();
  }

  document.getElementById("episodes-table").addEventListener("click", e => {
    const th = e.target.closest("th");
    if (th) toggleSort(th.dataset.key, e.shiftKey);
  });
  dom.filterTitle.addEventListener("input", () => setTimeout(applyFilters, 200));
  dom.filterEra.addEventListener("change", applyFilters);
  dom.filterDoctor.addEventListener("change", applyFilters);
  dom.filterCompanion.addEventListener("change", applyFilters);
  dom.exportCsv.addEventListener("click", exportCSV);
  dom.prev.addEventListener("click", () => { currentPage--; renderTable(); });
  dom.next.addEventListener("click", () => { currentPage++; renderTable(); });

  loadData();
})();
