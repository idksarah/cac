const map = L.map('map').setView([37.5, -120], 7);

// grayscale base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '© OpenStreetMap'
}).addTo(map);

// fixed ArcGIS GeoJSON query
const geojsonUrl = "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/2/query?where=YEAR_%3E%3D2022&outFields=*&f=geojson"; 

fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    console.log("Fetched features:", data.features?.length || 0);
    const fires = L.geoJSON(data, {
      style: {
        color: "#ff3300",
        fillColor: "#ff6600",
        weight: 0.8,
        fillOpacity: 0.5
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(`
          <b>${p.FIRE_NAME || "Unnamed Fire"}</b><br>
          <b>Acres:</b> ${Math.round(p.GIS_ACRES) || 0}<br>
          <b>Cause:</b> ${p.CAUSE || "Unknown"}
        `);
      }
    }).addTo(map);

    fires.bringToFront();
  })
  .catch(err => console.error("Error fetching GeoJSON:", err));