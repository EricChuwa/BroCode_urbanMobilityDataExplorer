console.log("City Lens loaded");

const API_BASE = "http://127.0.0.1:3000/api";

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

// ── Dummy data (replaced by API calls) ──
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
}
loadStatCards();

// ── Component C: Map ──
function initMap() {
  // Create the map centered on NYC
  const map = L.map("map", {
    center: [40.7128, -74.006],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    zoomControl: false,

    // Lock map to NYC bounds so user cannot scroll away
    maxBounds: [
      [40.4774, -74.2591],
      [40.9176, -73.7004],
    ],
    maxBoundsViscosity: 1.0,
  });

  // Dark tile layer from CartoDB
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CARTO",
    subdomains: "abcd",
    maxZoom: 16,
  }).addTo(map);

  return map;
}

const map = initMap();

// ── Component D: Zoom controls ──
function initZoomControls(map) {
  document.getElementById("zoom-in").addEventListener("click", () => {
    map.zoomIn();
  });

  document.getElementById("zoom-out").addEventListener("click", () => {
    map.zoomOut();
  });
}

initZoomControls(map);

// ── Component E: Chart toggle button ──
function initChartToggle() {
  const btn = document.getElementById("chart-toggle");
  const panel = document.getElementById("insights-panel");

  function openPanel() {
    panel.classList.add("open");
    btn.classList.add("active");
  }

  function closePanel() {
    panel.classList.remove("open");
    btn.classList.remove("active");
  }

  btn.addEventListener("click", () => {
    if (panel.classList.contains("open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  document.getElementById("panel-close").addEventListener("click", closePanel);
}

initChartToggle();

// ── Component F: Slide-in panel ──
async function initInsightsPanel() {
  const data = await fetchJSON(`${API_BASE}/summary/by-borough`);
  if (!data) return;

  const manhattan = data.find((b) => b.borough === "Manhattan");
  if (!manhattan) return;

  document.getElementById("panel-fare").textContent = `$${manhattan.avg_fare}`;
  document.getElementById("panel-pickups").textContent =
    parseInt(manhattan.trip_count).toLocaleString();
  document.getElementById("panel-distance").textContent =
    `${manhattan.avg_distance} mi`;
  document.getElementById("panel-peak").textContent = "18:00";
}

// ── Chart 1: Trip volume by hour ──
async function initHourlyChart() {
  const ctx = document.getElementById("hourly-chart").getContext("2d");
  const data = await fetchJSON(`${API_BASE}/summary/by-hour`);

  const hours = data ? data.map((d) => `${d.hour}:00`) : [];
  const tripCounts = data ? data.map((d) => parseInt(d.trip_count)) : [];

  window.hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          data: tripCounts,
          borderColor: "#378ADD",
          backgroundColor: "rgba(55,138,221,0.1)",
          borderWidth: 1.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#85B7EB",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#4a5568",
            font: { family: "Inter", size: 9 },
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#4a5568",
            font: { family: "Inter", size: 9 },
          },
        },
      },
    },
  });
}

// ── Chart 2: Avg fare by borough ──
async function initBoroughChart() {
  const ctx = document.getElementById("borough-chart").getContext("2d");
  const data = await fetchJSON(`${API_BASE}/summary/by-borough`);

  const filtered = data
    ? data.filter(
        (b) =>
          b.borough &&
          b.borough !== "NaN" &&
          b.borough !== "Unknown" &&
          b.borough !== "EWR"
      )
    : [];

  const labels = filtered.map((b) => b.borough);
  const fares = filtered.map((b) => parseFloat(b.avg_fare));

  window.boroughChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
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
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#4a5568",
            font: { family: "Inter", size: 9 },
          },
        },
        y: {
          grid: {
            color: "rgba(255,255,255,0.04)",
          },
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

// ── Component G: Filter bar ──
function initFilters() {
  document.getElementById("apply-filters").addEventListener("click", async () => {
    const filters = {
      hourStart: parseInt(document.getElementById("hour-start").value),
      hourEnd: parseInt(document.getElementById("hour-end").value),
      borough: document.getElementById("borough-filter").value,
      fareMin: parseFloat(document.getElementById("fare-min").value),
      fareMax: parseFloat(document.getElementById("fare-max").value),
      distMin: parseFloat(document.getElementById("dist-min").value),
      distMax: parseFloat(document.getElementById("dist-max").value),
    };

    console.log("Filters applied:", filters);

    // Build API URL with filters
    let url = `${API_BASE}/trips?limit=500`;
    if (filters.borough && filters.borough !== "All")
      url += `&borough=${encodeURIComponent(filters.borough)}`;
    if (filters.fareMin) url += `&min_fare=${filters.fareMin}`;
    if (filters.fareMax) url += `&max_fare=${filters.fareMax}`;
    if (filters.distMin) url += `&min_distance=${filters.distMin}`;
    if (filters.distMax) url += `&max_distance=${filters.distMax}`;

    const data = await fetchJSON(url);
    if (data) console.log(`Loaded ${data.length} trips`);

    // Show heat blobs once filters are applied
    showHeatBlobs(map);
  });
}

initFilters();

// ── GeoJSON: Load taxi zones onto map ──
function initZones(map) {
  fetch("assets/taxi_zones.geojson")
    .then((response) => response.json())
    .then((data) => {
      L.geoJSON(data, {
        style: function (feature) {
          return {
            fillColor: getZoneColour(feature.properties.borough),
            fillOpacity: 0.15,
            color: getZoneBorderColour(feature.properties.borough),
            weight: 0.5,
            opacity: 0.4,
          };
        },

        onEachFeature: function (feature, layer) {
          // Show zone name on hover
          layer.on("mouseover", function () {
            layer.setStyle({
              fillOpacity: 0.35,
              weight: 1,
              opacity: 0.8,
            });
          });

          // Reset on mouse out
          layer.on("mouseout", function () {
            layer.setStyle({
              fillOpacity: 0.15,
              weight: 0.5,
              opacity: 0.4,
            });
          });

          // Show zone info in panel on click
          // Show zone info in panel on click
          layer.on("click", async function () {
            const props = feature.properties;

            // Update panel zone info
            document.getElementById("panel-zone-name").textContent = props.zone;
            document.getElementById("panel-zone-sub").textContent =
              props.borough + " · Zone " + props.LocationID;

            // Open the panel
            document.getElementById("insights-panel").classList.add("open");
            document.getElementById("chart-toggle").classList.add("active");

            // Fetch zone stats and hourly data in parallel
            const [stats, hourly] = await Promise.all([
              fetchJSON(`${API_BASE}/zones/${props.LocationID}/summary`),
              fetchJSON(`${API_BASE}/zones/${props.LocationID}/by-hour`)
            ]);

            // Update panel stats
            if (stats) {
              document.getElementById("panel-fare").textContent =
                `$${stats.avg_fare}`;
              document.getElementById("panel-pickups").textContent =
                parseInt(stats.trip_count).toLocaleString();
              document.getElementById("panel-distance").textContent =
                `${stats.avg_distance} mi`;
              document.getElementById("panel-peak").textContent =
                `${stats.peak_hour}:00`;
            }

            // Highlight clicked zone's borough in the chart
            if (window.boroughChart && stats) {
              const boroughIndex = window.boroughChart.data.labels
                .indexOf(stats.borough);

              window.boroughChart.data.datasets[0].backgroundColor =
                window.boroughChart.data.labels.map((_, i) =>
                  i === boroughIndex
                    ? "rgba(55,138,221,1.0)"
                    : "rgba(55,138,221,0.25)"
                );
              window.boroughChart.update();
            }

            // Update hourly chart with zone-specific data
            if (hourly && window.hourlyChart) {
              window.hourlyChart.data.labels =
                hourly.map((d) => `${d.hour}:00`);
              window.hourlyChart.data.datasets[0].data =
                hourly.map((d) => parseInt(d.trip_count));
              window.hourlyChart.update();
            }
          });
        },
      }).addTo(map);
    })
    .catch((err) => console.error("GeoJSON load error:", err));
}

// ── Colour each borough differently ──
function getZoneColour(borough) {
  const colours = {
    Manhattan: "#378ADD",
    Brooklyn: "#5DCAA5",
    Queens: "#EF9F27",
    Bronx: "#7F77DD",
    "Staten Island": "#D85A30",
    EWR: "#888780",
  };
  return colours[borough] || "#378ADD";
}

function getZoneBorderColour(borough) {
  const colours = {
    Manhattan: "#85B7EB",
    Brooklyn: "#9FE1CB",
    Queens: "#FAC775",
    Bronx: "#AFA9EC",
    "Staten Island": "#F0997B",
    EWR: "#B4B2A9",
  };
  return colours[borough] || "#85B7EB";
}

initZones(map);

// ── Heat blobs: show activity intensity per zone ──
let heatBlobLayer = null;

function showHeatBlobs(map) {
  // Remove old blobs if they exist
  if (heatBlobLayer) {
    map.removeLayer(heatBlobLayer);
  }

  // Dummy pickup data per zone (will come from API later)
  // Format: [latitude, longitude, pickup count]
  const dummyZoneActivity = [
    [40.7549, -73.984, 4821], // Midtown
    [40.758, -73.9855, 3950], // Times Square area
    [40.7128, -74.006, 2100], // Lower Manhattan
    [40.6892, -73.9442, 1450], // Brooklyn
    [40.7282, -73.7949, 1800], // Queens / JFK area
    [40.8448, -73.8648, 600], // Bronx
    [40.5795, -74.1502, 300], // Staten Island
  ];

  // Find the highest pickup count to scale everything else against
  const maxCount = Math.max(...dummyZoneActivity.map((z) => z[2]));

  const blobs = dummyZoneActivity.map((zone) => {
    const [lat, lng, count] = zone;

    // Scale radius between 800m and 2200m based on activity
    const radius = 800 + (count / maxCount) * 1400;

    let colour;
    if (count / maxCount > 0.6) {
      colour = "#EF9F27"; // gold = high
    } else if (count / maxCount > 0.3) {
      colour = "#5DCAA5"; // teal = medium
    } else {
      colour = isLight ? "#1A5FA3" : "#378ADD";
    }

    // The soft glowing blob
    const blob = L.circle([lat, lng], {
      radius: radius,
      fillColor: colour,
      fillOpacity: isLight ? 0.45 : 0.25,
      color: colour,
      weight: 0,
      opacity: 0.6,
    });

    // The precise center point marker
    const point = L.circleMarker([lat, lng], {
      radius: 3,
      fillColor: "#FFFFFF",
      fillOpacity: 0.9,
      color: colour,
      weight: 1.5,
      opacity: 1,
    });

    return [blob, point];
  }).filter(Boolean);

  const flatBlobs = blobs.flat();
  heatBlobLayer = L.layerGroup(flatBlobs).addTo(map);
}

function hideHeatBlobs(map) {
  if (heatBlobLayer) {
    map.removeLayer(heatBlobLayer);
    heatBlobLayer = null;
  }
}

// Load heat blobs on startup
showHeatBlobs(map);

// ── Theme toggle: light / dark mode ──
function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLight = document.body.classList.contains("light-mode");
    updateMapTheme(isLight);

    // Refresh heat blobs with theme-correct colours if visible
    if (heatBlobLayer) {
      showHeatBlobs(map);
    }

    toggleBtn.innerHTML = isLight
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>';
  });
}

function updateMapTheme(isLight) {
  // Remove the existing tile layer
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });

  // Add the correct tile layer for the theme
  const tileUrl = isLight
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  L.tileLayer(tileUrl, {
    attribution: "© OpenStreetMap © CARTO",
    subdomains: "abcd",
    maxZoom: 16,
  }).addTo(map);
}

initThemeToggle();