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

  btn.addEventListener("click", () => {
    // Toggle the active class on the button
    btn.classList.toggle("active");

    // Toggle the open class on the panel
    panel.classList.toggle("open");
  });
}

initChartToggle();

// ── Component F: Slide-in panel ──
function initInsightsPanel() {
  // Close button inside the panel
  document.getElementById("panel-close").addEventListener("click", () => {
    document.getElementById("insights-panel").classList.remove("open");
    document.getElementById("chart-toggle").classList.remove("active");
  });

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
