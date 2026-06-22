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

  new Chart(ctx, {
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
          grid: {
            color: "rgba(255,255,255,0.04)",
          },
          ticks: {
            color: "#4a5568",
            font: { family: "Inter", size: 9 },
            maxRotation: 0,
          },
        },
        y: {
          grid: {
            color: "rgba(255,255,255,0.04)",
          },
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

  new Chart(ctx, {
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

            // Fetch real stats for this zone
            const stats = await fetchJSON(
              `${API_BASE}/zones/${props.LocationID}/summary`
            );

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

// Real zone coordinates for top pickup zones
const ZONE_COORDS = {
  "JFK Airport":                  [40.6413, -73.7781],
  "Upper East Side South":        [40.7648, -73.9595],
  "Upper East Side North":        [40.7736, -73.9566],
  "Midtown Center":               [40.7549, -73.9840],
  "Penn Station/Madison Sq West": [40.7506, -73.9971],
  "Midtown East":                 [40.7523, -73.9714],
  "Lincoln Square East":          [40.7741, -73.9825],
  "Times Sq/Theatre District":    [40.7580, -73.9855],
  "LaGuardia Airport":            [40.7769, -73.8740],
  "Upper West Side South":        [40.7751, -73.9844],
};

async function showHeatBlobs(map) {
  // Remove old blobs if they exist
  if (heatBlobLayer) {
    map.removeLayer(heatBlobLayer);
  }

  // Fetch real pickup data from API
  const data = await fetchJSON(`${API_BASE}/zones/top-pickup?limit=10`);
  if (!data) return;

  // Find the highest pickup count to scale everything else against
  const maxCount = Math.max(...data.map((z) => parseInt(z.trip_count)));

  const blobs = data.map((zone) => {
    const coords = ZONE_COORDS[zone.zone];
    if (!coords) return null;

    const count = parseInt(zone.trip_count);
    const ratio = count / maxCount;

    // Scale radius between 800m and 2200m based on activity
    const radius = 800 + ratio * 1400;

    // Pick colour based on activity level
    let colour;
    if (ratio > 0.6) {
      colour = "#EF9F27"; // gold = high
    } else if (ratio > 0.3) {
      colour = "#5DCAA5"; // teal = medium
    } else {
      colour = "#378ADD"; // blue = low
    }

    // The soft glowing blob
    const blob = L.circle(coords, {
      radius: radius,
      fillColor: colour,
      fillOpacity: 0.25,
      color: colour,
      weight: 0,
      opacity: 0.5,
    });

    // The precise center point marker
    const point = L.circleMarker(coords, {
      radius: 3,
      fillColor: "#FFFFFF",
      fillOpacity: 0.9,
      color: colour,
      weight: 1.5,
      opacity: 1,
    });

    return [blob, point];
  }).filter(Boolean);

  // Flatten since each zone now returns two layers (blob + point)
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

    // Swap the map tile layer to match the theme
    const isLight = document.body.classList.contains("light-mode");
    updateMapTheme(isLight);
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