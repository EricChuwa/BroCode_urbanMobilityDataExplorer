console.log("City Lens loaded");

// ── Dummy data (will be replaced by API calls later) ──
function loadStatCards() {
  document.getElementById("stat-fare").textContent = "$18.40";
  document.getElementById("stat-distance").textContent = "3.2 mi";
  document.getElementById("stat-peak").textContent = "6 pm";
  document.getElementById("stat-zone").textContent = "Midtown";
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
function initInsightsPanel() {
  // Load dummy data into panel stats
  document.getElementById("panel-fare").textContent = "$22.10";
  document.getElementById("panel-pickups").textContent = "4,821";
  document.getElementById("panel-distance").textContent = "3.4 mi";
  document.getElementById("panel-peak").textContent = "6 pm";
}

// ── Chart 1: Trip volume by hour ──
function initHourlyChart() {
  const ctx = document.getElementById("hourly-chart").getContext("2d");

  const hours = [
    "12a",
    "2a",
    "4a",
    "6a",
    "8a",
    "10a",
    "12p",
    "2p",
    "4p",
    "6p",
    "8p",
    "10p",
  ];

  const data = [320, 180, 90, 210, 580, 720, 650, 700, 740, 890, 760, 540];

  new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          data: data,
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
function initBoroughChart() {
  const ctx = document.getElementById("borough-chart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Manhattan", "Queens", "Brooklyn", "Bronx", "S. Island"],
      datasets: [
        {
          data: [22.1, 17.4, 14.8, 12.3, 10.9],
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
  document.getElementById("apply-filters").addEventListener("click", () => {
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

    // Show heat blobs once filters are applied
    showHeatBlobs(map);

    // Later this will pass filters to the API
    // and load real pickup counts per zone
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
          layer.on("click", function () {
            const props = feature.properties;

            // Update panel zone info
            document.getElementById("panel-zone-name").textContent = props.zone;
            document.getElementById("panel-zone-sub").textContent =
              props.borough + " · Zone " + props.LocationID;

            // Open the panel
            document.getElementById("insights-panel").classList.add("open");
            document.getElementById("chart-toggle").classList.add("active");
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

    // Pick colour based on activity level
    let colour;
    if (count / maxCount > 0.6) {
      colour = "#EF9F27"; // gold = high
    } else if (count / maxCount > 0.3) {
      colour = "#5DCAA5"; // teal = medium
    } else {
      colour = "#378ADD"; // blue = low
    }

    // The soft glowing blob
    const blob = L.circle([lat, lng], {
      radius: radius,
      fillColor: colour,
      fillOpacity: 0.25,
      color: colour,
      weight: 0,
      opacity: 0.5,
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
  });

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
