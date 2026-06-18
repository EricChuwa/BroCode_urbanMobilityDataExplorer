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
  const map = L.map('map', {
    center: [40.7128, -74.0060],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    zoomControl: false,

    // Lock map to NYC bounds so user cannot scroll away
    maxBounds: [
      [40.4774, -74.2591],
      [40.9176, -73.7004]
    ],
    maxBoundsViscosity: 1.0
  });

  // Dark tile layer from CartoDB
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 16
    }
  ).addTo(map);

  return map;
}

const map = initMap();