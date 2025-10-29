let countiesLayer; 

let wildfires = [];

fetch('./counties.geojson')
  .then(response => response.json())
  .then(countyData => {
    countiesLayer = L.geoJSON(countyData, {
      style: {
        color: "#3b3b3bff",
        fillColor: "#eaeaeaff",
        weight: 1,
        fillOpacity: 0.1
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        layer.bindPopup(`<b>County:</b> ${p.NAME}<br>`);

        const option = document.createElement('option');
        option.value = p.NAME;
        option.textContent = p.NAME;
        document.getElementById('countySelect').appendChild(option);
      }
    }).addTo(map);
  });

document.getElementById('countySelect').addEventListener('change', e => {
  const selectedName = e.target.value;

  countiesLayer.eachLayer(layer => {
    if (layer.feature.properties.NAME === selectedName) {
      layer.setStyle({ fillColor: "#ffd261ff", fillOpacity: 0.5, weight: 2 });
      map.fitBounds(layer.getBounds().pad(0.5));
    } else {
      layer.setStyle({ fillColor: "#ffffffff", fillOpacity: 0.1, weight: 1 });
    }
  });
});

const map = L.map('map').setView([37.5, -120], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const geojsonUrl = "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/2/query?where=YEAR_%3E%3D2022&outFields=*&f=geojson"; 

const ACRE_FILTER = 15000;

fetch(geojsonUrl)
  .then(res => res.json())
  .then(data => {
    console.log("Fetched features:", data.features?.length || 0);
    const fires = L.geoJSON(data, {
      style: feature =>{
        const acres = feature.properties.GIS_ACRES;
        if (acres < ACRE_FILTER) {
          return {opacity: 0, fillOpacity: 0};
        }

        return {
          color: "#ff3300",
          fillColor: "#ff6600",
          weight: 0.8,
          fillOpacity: 0.5
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        
        if (p.GIS_ACRES >= ACRE_FILTER) {
          const coords = feature.geometry.coordinates[0]; 
          
          let latSum = 0, lngSum = 0, count = 0;
          coords.forEach(coord => {
            lngSum += coord[0];
            latSum += coord[1];
            count++;
          });
          if (lngSum.toString().slice(0,2) == "0-") {
            lngSum = parseInt(lngSum.toString().slice(2, lngSum.length))
          }
          if (latSum.toString().slice(0,2) == "0-") {
            latSum = parseInt(latSum.toString().slice(2, latSum.length));
          }
          const centroidLat = latSum / count;
          const centroidLng = lngSum / count;

          wildfires.push({centroidLat, centroidLng});
        }
      }
    }).addTo(map);
  })
  .catch(err => console.error("Error fetching GeoJSON:", err));