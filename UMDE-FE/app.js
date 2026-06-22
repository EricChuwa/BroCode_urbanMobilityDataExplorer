console.log("City Lens loaded");

const API_BASE = "http://127.0.0.1:3000/api";

let geoJSONCache = null;

async function getGeoJSON() {
  if (geoJSONCache) return geoJSONCache;
  geoJSONCache = await fetch("assets/taxi_zones.geojson").then(r => r.json());
  return geoJSONCache;
}

// ── Fetch helper ──
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

// ── Stat Cards ──
async function loadStatCards() {
  const [boroughData, hourData] = await Promise.all([
    fetchJSON(`${API_BASE}/summary/by-borough`),
    fetchJSON(`${API_BASE}/summary/by-hour`)
  ]);

  if (!boroughData || !hourData) return;

  const manhattan = boroughData.find((b) => b.borough === "Manhattan");
  const all = boroughData.filter(
    (b) => b.borough && b.borough !== "NaN" && b.borough !== "Unknown" && b.borough !== "EWR"
  );
  const peakHour = hourData.reduce((max, h) =>
    parseInt(h.trip_count) > parseInt(max.trip_count) ? h : max
  );

  document.getElementById("stat-fare").textContent =
    manhattan ? `$${manhattan.avg_fare}` : "N/A";
  document.getElementById("stat-distance").textContent =
    manhattan ? `${manhattan.avg_distance} mi` : "N/A";
  document.getElementById("stat-peak").textContent = `${peakHour.hour}:00`;
  document.getElementById("stat-zone").textContent =
    all[0] ? all[0].borough : "N/A";

  const totalTrips = boroughData.reduce(
    (sum, b) => sum + parseInt(b.trip_count), 0
  );
  const formatted = totalTrips >= 1_000_000
    ? `${(totalTrips / 1_000_000).toFixed(1)}M trips`
    : `${(totalTrips / 1_000).toFixed(0)}K trips`;

  document.getElementById('trip-count-value').textContent = formatted;
}

loadStatCards();

// ── Map ──
function initMap() {
  const map = L.map("map", {
    center: [40.7128, -74.006],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    zoomControl: false,
    maxBounds: [
      [40.4774, -74.2591],
      [40.9176, -73.7004],
    ],
    maxBoundsViscosity: 1.0,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CARTO",
    subdomains: "abcd",
    maxZoom: 16,
  }).addTo(map);

  return map;
}

const map = initMap();

// ── Zoom controls ──
function initZoomControls(map) {
  document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
  document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());
}

initZoomControls(map);

// ── Chart toggle ──
function initChartToggle() {
  const btn   = document.getElementById("chart-toggle");
  const panel = document.getElementById("insights-panel");

  function openPanel()  { panel.classList.add("open");    btn.classList.add("active"); }
  function closePanel() { panel.classList.remove("open"); btn.classList.remove("active"); }

  btn.addEventListener("click", () => {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });

  document.getElementById("panel-close").addEventListener("click", closePanel);
}

initChartToggle();

// ── Insights panel ──
async function initInsightsPanel() {
  const data = await fetchJSON(`${API_BASE}/summary/by-borough`);
  if (!data) return;

  const manhattan = data.find((b) => b.borough === "Manhattan");
  if (!manhattan) return;

  document.getElementById("panel-fare").textContent     = `$${manhattan.avg_fare}`;
  document.getElementById("panel-pickups").textContent  = parseInt(manhattan.trip_count).toLocaleString();
  document.getElementById("panel-distance").textContent = `${manhattan.avg_distance} mi`;
  document.getElementById("panel-peak").textContent     = "18:00";
}

// ── Chart 1: Trip volume by hour ──
async function initHourlyChart() {
  const ctx  = document.getElementById("hourly-chart").getContext("2d");
  const data = await fetchJSON(`${API_BASE}/summary/by-hour`);

  const hours      = data ? data.map((d) => `${d.hour}:00`) : [];
  const tripCounts = data ? data.map((d) => parseInt(d.trip_count)) : [];

  window.hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [{
        data: tripCounts,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.1)",
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#85B7EB",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#4a5568", font: { family: "Inter", size: 9 }, maxRotation: 0 },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#4a5568", font: { family: "Inter", size: 9 } },
        },
      },
    },
  });
}

// ── Chart 2: Avg fare by borough ──
async function initBoroughChart() {
  const ctx  = document.getElementById("borough-chart").getContext("2d");
  const data = await fetchJSON(`${API_BASE}/summary/by-borough`);

  const filtered = data
    ? data.filter((b) =>
        b.borough &&
        b.borough !== "NaN" &&
        b.borough !== "Unknown" &&
        b.borough !== "EWR"
      )
    : [];

  const labels = filtered.map((b) => b.borough);
  const fares  = filtered.map((b) => parseFloat(b.avg_fare));

  window.boroughChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: fares,
        backgroundColor: [
          "rgba(55,138,221,0.7)",
          "rgba(55,138,221,0.55)",
          "rgba(55,138,221,0.45)",
          "rgba(55,138,221,0.35)",
          "rgba(55,138,221,0.25)",
        ],
        borderColor: "transparent",
        borderRadius: 3,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#4a5568", font: { family: "Inter", size: 9 } },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#4a5568",
            font: { family: "Inter", size: 9 },
            callback: (val) => "$" + val,
          },
        },
      },
    },
  });
}

initInsightsPanel();
initHourlyChart();
initBoroughChart();

// ── GeoJSON zones ──
function initZones(map) {
  fetch("assets/taxi_zones.geojson")
    .then((res) => res.json())
    .then((data) => {
      L.geoJSON(data, {
        style: (feature) => ({
          fillColor:   getZoneColour(feature.properties.borough),
          fillOpacity: 0.15,
          color:       getZoneBorderColour(feature.properties.borough),
          weight:      0.5,
          opacity:     0.4,
        }),
        onEachFeature: (feature, layer) => {
          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.35, weight: 1, opacity: 0.8 }));
          layer.on("mouseout",  () => layer.setStyle({ fillOpacity: 0.15, weight: 0.5, opacity: 0.4 }));
          layer.on("click", async () => {
            const props = feature.properties;

            document.getElementById("panel-zone-name").textContent = props.zone;
            document.getElementById("panel-zone-sub").textContent  =
              props.borough + " · Zone " + props.LocationID;
            document.getElementById("insights-panel").classList.add("open");
            document.getElementById("chart-toggle").classList.add("active");

            const [stats, hourly] = await Promise.all([
              fetchJSON(`${API_BASE}/zones/${props.LocationID}/summary`),
              fetchJSON(`${API_BASE}/zones/${props.LocationID}/by-hour`)
            ]);

            if (stats) {
              document.getElementById("panel-fare").textContent     = `$${stats.avg_fare}`;
              document.getElementById("panel-pickups").textContent  = parseInt(stats.trip_count).toLocaleString();
              document.getElementById("panel-distance").textContent = `${stats.avg_distance} mi`;
              document.getElementById("panel-peak").textContent     = `${stats.peak_hour}:00`;
            }

            if (window.boroughChart && stats) {
              const boroughIndex = window.boroughChart.data.labels.indexOf(stats.borough);
              window.boroughChart.data.datasets[0].backgroundColor =
                window.boroughChart.data.labels.map((_, i) =>
                  i === boroughIndex ? "rgba(55,138,221,1.0)" : "rgba(55,138,221,0.25)"
                );
              window.boroughChart.update();
            }

            if (hourly && window.hourlyChart) {
              window.hourlyChart.data.labels              = hourly.map((d) => `${d.hour}:00`);
              window.hourlyChart.data.datasets[0].data    = hourly.map((d) => parseInt(d.trip_count));
              window.hourlyChart.update();
            }
          });
        },
      }).addTo(map);
    })
    .catch((err) => console.error("GeoJSON load error:", err));
}

function getZoneColour(borough) {
  const colours = {
    Manhattan: "#378ADD", Brooklyn: "#5DCAA5",
    Queens: "#EF9F27", Bronx: "#7F77DD",
    "Staten Island": "#D85A30", EWR: "#888780",
  };
  return colours[borough] || "#378ADD";
}

function getZoneBorderColour(borough) {
  const colours = {
    Manhattan: "#85B7EB", Brooklyn: "#9FE1CB",
    Queens: "#FAC775", Bronx: "#AFA9EC",
    "Staten Island": "#F0997B", EWR: "#B4B2A9",
  };
  return colours[borough] || "#85B7EB";
}

initZones(map);

// ── Heat blobs ──
let heatBlobLayer = null;

async function showHeatBlobs(map, filteredData = null) {
  if (heatBlobLayer) map.removeLayer(heatBlobLayer);

  const data = filteredData ||
    await fetchJSON(`${API_BASE}/zones/activity`);

  console.log('showHeatBlobs data:', data?.length, 'zones');

  if (!data || data.length === 0) {
    console.warn('No data for blobs');
    return;
  }

  const geoData = await getGeoJSON();
  console.log('GeoJSON features:', geoData?.features?.length);

  const maxCount = Math.max(...data.map(z => parseInt(z.trip_count)));

  const blobs = data.map(zone => {
    const feature = geoData.features.find(
      f => f.properties.zone === zone.zone
    );
    if (!feature) {
      console.warn('No GeoJSON match for zone:', zone.zone);
      return null;
    }

    // Handle both Polygon and MultiPolygon
    const coords = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0];

    if (!coords || coords.length === 0) return null;

    const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    if (isNaN(lat) || isNaN(lng)) return null;

    const count  = parseInt(zone.trip_count);
    const ratio  = count / maxCount;
    const radius = 600 + ratio * 1800;

    const colour = ratio > 0.6 ? '#EF9F27'
                 : ratio > 0.3 ? '#5DCAA5'
                 : '#378ADD';

    const blob = L.circle([lat, lng], {
      radius,
      fillColor: colour,
      fillOpacity: 0.15,
      color: colour,
      weight: 0,
      opacity: 0.6,
      interactive: false,
    });

    return [blob];
  }).filter(Boolean).flat();

  console.log('Blobs created:', blobs.length);
  heatBlobLayer = L.layerGroup(blobs).addTo(map);
}

// Load blobs on startup
showHeatBlobs(map);

// ── Filter bar ──
function initFilters() {
  document.getElementById("apply-filters").addEventListener("click", async () => {
    const hourStart = document.getElementById("hour-start").value;
    const hourEnd   = document.getElementById("hour-end").value;
    const borough   = document.getElementById("borough-filter").value;
    const fareMin   = document.getElementById("fare-min").value;
    const fareMax   = document.getElementById("fare-max").value;
    const distMin   = document.getElementById("dist-min").value;
    const distMax   = document.getElementById("dist-max").value;

    const isDefault =
      (!borough || borough === 'All' || borough === '') &&
      (fareMin === '0' || fareMin === '') &&
      (fareMax === '100' || fareMax === '') &&
      (distMin === '0' || distMin === '') &&
      (distMax === '50' || distMax === '') &&
      (hourStart === '0' || hourStart === '') &&
      (hourEnd === '23' || hourEnd === '');

    if (isDefault) {
      showHeatBlobs(map);
      loadStatCards();
      return;
    }

    let url = `${API_BASE}/zones/activity?`;
    if (borough && borough !== 'All' && borough !== '')
      url += `&borough=${encodeURIComponent(borough)}`;
    if (fareMin && fareMin !== '0')   url += `&min_fare=${fareMin}`;
    if (fareMax && fareMax !== '100') url += `&max_fare=${fareMax}`;
    if (distMin && distMin !== '0')   url += `&min_distance=${distMin}`;
    if (distMax && distMax !== '50')  url += `&max_distance=${distMax}`;
    if (hourStart && hourStart !== '0')  url += `&hour_start=${hourStart}`;
    if (hourEnd && hourEnd !== '23')     url += `&hour_end=${hourEnd}`;

    const filteredData = await fetchJSON(url);
    if (!filteredData) return;

    showHeatBlobs(map, filteredData);

    const totalTrips = filteredData.reduce(
      (sum, z) => sum + parseInt(z.trip_count), 0
    );
    const avgFare = (
      filteredData.reduce((sum, z) => sum + parseFloat(z.avg_fare), 0) /
      filteredData.length
    ).toFixed(2);
    const avgDist = (
      filteredData.reduce((sum, z) => sum + parseFloat(z.avg_distance), 0) /
      filteredData.length
    ).toFixed(2);

    const formatted = totalTrips >= 1_000_000
      ? `${(totalTrips / 1_000_000).toFixed(1)}M trips`
      : `${(totalTrips / 1_000).toFixed(0)}K trips`;

    document.getElementById('trip-count-value').textContent = formatted;
    document.getElementById('stat-fare').textContent        = `$${avgFare}`;
    document.getElementById('stat-distance').textContent    = `${avgDist} mi`;
    document.getElementById('stat-zone').textContent        =
      filteredData[0] ? filteredData[0].borough : 'N/A';
  });
}

initFilters();