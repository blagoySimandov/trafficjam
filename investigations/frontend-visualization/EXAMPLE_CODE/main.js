// ---------------------------
// CAMERA: Top-down Cork
// ---------------------------

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#0b0b0b" } }
    ]
  },
  center: [-8.4756, 51.8985], // Cork center
  zoom: 13,
  pitch: 0,   // top-down
  bearing: 0  // north-up
});


// ---------------------------
// LOAD ROAD NETWORK (GeoJSON)
// ---------------------------

async function loadRoadNetwork() {
  try {
    const res = await fetch("roads.geojson");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    console.log("✓ Loaded road network:", data.features.length, "roads");
    return data;
  } catch (error) {
    console.error("Failed to load road network:", error);
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}


// ---------------------------
// LOAD TRIPS DATA
// ---------------------------

async function loadTripsData() {
  try {
    const res = await fetch("trips.json");
    if (!res.ok) {
      console.log("No trips.json found");
      return null;
    }
    const data = await res.json();
    console.log(`✓ Loaded ${data.length} trips from MATSim data`);
    return data;
  } catch (error) {
    console.log("Error loading trips.json:", error);
    return null;
  }
}


// ---------------------------
// ADD COLORS TO MATSIM TRIPS
// ---------------------------

function addColorsToTrips(trips) {
  const colors = [
    [0, 200, 255],
    [255, 100, 100],
    [100, 255, 100],
    [255, 200, 0],
    [255, 100, 255]
  ];
  
  return trips.map((trip, i) => ({
    ...trip,
    color: trip.color || colors[i % colors.length]
  }));
}


// ---------------------------
// NORMALIZE TIMESTAMPS
// ---------------------------

function normalizeTripsTimestamps(trips) {
  if (trips.length === 0) return trips;
  
  const minTime = Math.min(...trips.flatMap(t => t.timestamps));
  
  console.log(`Normalizing timestamps (min time: ${minTime})`);
  
  return trips.map(trip => ({
    ...trip,
    timestamps: trip.timestamps.map(t => t - minTime)
  }));
}


// ---------------------------
// TIME FORMATTING - IMPROVED
// ---------------------------

function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}


let currentTime = 0;
let maxTime = 100;
let animationSpeed = 1.0;
let isPlaying = true;
let animationFrameId = null;


// ---------------------------
// MAP ON LOAD: DRAW ROADS + TRIPS
// ---------------------------

map.on("load", async () => {
  console.log("Map loaded, initializing...");
  
  const geojson = await loadRoadNetwork();

  let tripsData = await loadTripsData();
  
  if (!tripsData || tripsData.length === 0) {
    console.error("No trip data available!");
    return;
  }

  tripsData = normalizeTripsTimestamps(tripsData);
  tripsData = addColorsToTrips(tripsData);

  // Calculate max time
  maxTime = Math.max(...tripsData.flatMap(t => t.timestamps));
  console.log(`Max simulation time: ${maxTime}s`);
  
  // Setup time scrubber
  const timeScrubber = document.getElementById('time-scrubber');
  timeScrubber.max = maxTime;
  document.getElementById('total-time-label').textContent = formatTime(maxTime);

  console.log("Trips data prepared:", tripsData.length, "vehicles");

  // Update stats
  document.getElementById('road-count').textContent = geojson.features.length;
  document.getElementById('total-vehicles').textContent = tripsData.length;

  const roadLayer = new deck.PathLayer({
    id: "roads",
    data: geojson.features,
    getPath: f => f.geometry.coordinates,
    getColor: f =>
      f.properties.type === "primary" ? [220, 220, 220] : [140, 140, 140],
    widthMinPixels: 3,
    rounded: true
  });

  const tripsLayer = new deck.TripsLayer({
    id: "trips",
    data: tripsData,
    getPath: d => d.path,
    getTimestamps: d => d.timestamps,
    getColor: d => d.color,
    opacity: 0.8,
    widthMinPixels: 6,
    trailLength: 10,
    currentTime: currentTime
  });

  const deckOverlay = new deck.MapboxOverlay({
    layers: [roadLayer, tripsLayer]
  });

  map.addControl(deckOverlay);

  console.log("Layers added to map");


  // ---------------------------
  // UI CONTROLS
  // ---------------------------

  // Speed control
  document.getElementById('speed-slider').addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    document.getElementById('speed-value').textContent = `${animationSpeed.toFixed(1)}x`;
  });

  // Restart button
  document.getElementById('restart-btn').addEventListener('click', async () => {
    console.log("Restarting simulation...");
    currentTime = 0;
    timeScrubber.value = 0;
    
    const loadedTrips = await loadTripsData();
    if (loadedTrips) {
      tripsData = normalizeTripsTimestamps(loadedTrips);
      tripsData = addColorsToTrips(tripsData);
      maxTime = Math.max(...tripsData.flatMap(t => t.timestamps));
      timeScrubber.max = maxTime;
      document.getElementById('total-time-label').textContent = formatTime(maxTime);
      document.getElementById('total-vehicles').textContent = tripsData.length;
    }
  });

  // Play/Pause button
  const playPauseBtn = document.getElementById('play-pause-btn');
  playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    
    if (isPlaying && !animationFrameId) {
      animate();
    }
  });

  // Time scrubber
  let isScrubbing = false;
  
  timeScrubber.addEventListener('mousedown', () => {
    isScrubbing = true;
  });
  
  timeScrubber.addEventListener('mouseup', () => {
    isScrubbing = false;
  });
  
  timeScrubber.addEventListener('input', (e) => {
    currentTime = parseFloat(e.target.value);
    updateVisualization();
  });


  // ---------------------------
  // UPDATE VISUALIZATION
  // ---------------------------

  function updateVisualization() {
    const activeVehicles = tripsData.filter(trip => {
      const minTime = trip.timestamps[0];
      const maxTime = trip.timestamps[trip.timestamps.length - 1];
      return currentTime >= minTime && currentTime <= maxTime;
    }).length;

    document.getElementById('active-vehicles').textContent = activeVehicles;
    document.getElementById('sim-time').textContent = formatTime(currentTime);
    document.getElementById('current-time-label').textContent = formatTime(currentTime);
    
    if (!isScrubbing) {
      timeScrubber.value = currentTime;
    }

    deckOverlay.setProps({
      layers: [
        roadLayer,
        new deck.TripsLayer({
          id: "trips",
          data: tripsData,
          getPath: d => d.path,
          getTimestamps: d => d.timestamps,
          getColor: d => d.color,
          opacity: 0.8,
          widthMinPixels: 6,
          trailLength: 10,
          currentTime: currentTime
        })
      ]
    });
  }


  // ---------------------------
  // ANIMATE TRIPS
  // ---------------------------

  function animate() {
    if (isPlaying && !isScrubbing) {
      currentTime += 0.1 * animationSpeed;
      
      if (currentTime > maxTime) {
        currentTime = 0;
        console.log("Loop complete, restarting from 0");
      }
    }

    updateVisualization();

    animationFrameId = requestAnimationFrame(animate);
  }

  console.log("Starting animation...");
  animate();
});