let countiesLayer;
let wildfires = [];
let countyDataGlobal;

fetch('./counties.geojson')
  .then(response => response.json())
  .then(countyData => {
    countyDataGlobal = countyData;
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

        layer.on('click', () => {
          const name = p.NAME;
          const stats = countyStats[name];
          const dashboard = document.getElementById("dashboardContainer");

          if (stats) {
            dashboard.innerHTML = `
              <h2>${name} County</h2>
              <canvas id="countyChart" width="400" height="200"></canvas>
            `;

          if (countyStats[name]) {
            console.log("found");
let report = document.getElementById("report");
            report.textContent = countyStats[name].report;
          }

  const ctx = document.getElementById("countyChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Population (M)", "Area (mi²)", "Drought Index (D0-D4)", "Recent Fires"],
      datasets: [{
        label: `${name} County Stats`,
        data: [
          parseFloat(stats.population.replace(/[^\d.]/g, "")) * 100,
          parseFloat(stats.area.replace(/[^\d.]/g, "")) / 100,
          stats.droughtIndex,      
          stats.recentFires
        ],

        backgroundColor: ["#71b3f9ff", "#ff9730ff", "#ff7151ff", "#ff585bff"],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${stats.riskLevel} Fire Risk`,
          color: "#333",
          font: { size: 16, weight: "bold" }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#eee" } }
      }
    }
  });
} else {
  dashboard.innerHTML = `<h2>${name} County</h2><p>No dashboard data available.</p>`;
}

        });

      }
    }).addTo(map);

    
    const countyNames = countyData.features.map(f => f.properties.NAME);
    countyNames.sort((a, b) => a.localeCompare(b));
    const selectEl = document.getElementById('countySelect');
    countyNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      selectEl.appendChild(option);
      selectEl.value = "";
    });

    loadWildfires();
  });

const map = L.map('map').setView([37.5, -120], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const geojsonUrl = "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer/2/query?where=YEAR_%3E%3D2022&outFields=*&f=geojson"; 
const ACRE_FILTER = 15000;

function loadWildfires() {
  fetch(geojsonUrl)
    .then(res => res.json())
    .then(data => {
      const fires = L.geoJSON(data, {
        style: feature => {
          const acres = feature.properties.GIS_ACRES;
          if (acres < ACRE_FILTER) return { opacity: 0, fillOpacity: 0 };
          return {
            color: "#ff3300",
            fillColor: "#ff6600",
            weight: 0.8,
            fillOpacity: 0.5
          };
        },
        onEachFeature: (feature) => {
          const p = feature.properties;if (p.GIS_ACRES >= ACRE_FILTER) {
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

      highlightAffectedCounties();
    })
    .catch(err => console.error("Error fetching GeoJSON:", err));
}

document.getElementById('countySelect').addEventListener('change', e => {
  const selectedName = e.target.value;

  countiesLayer.eachLayer(layer => {
    if (layer.feature.properties.NAME === selectedName) {
      layer.setStyle({ fillColor: "#ffda7bff", fillOpacity: 0.5, weight: 2 });
      map.fitBounds(layer.getBounds().pad(0.5));
    } else if (layer.feature.properties.color == "#ffb347") {
      layer.setStyle({ fillColor: "#ffffffff", fillOpacity: 0.1, weight: 1 });
    }
  });
});

function highlightAffectedCounties() {
  if (!countiesLayer) return;

  countiesLayer.eachLayer(layer => {
    const countyPoly = layer.feature;

    const hit = wildfires.some(fire => {
      const point = turf.point([fire.centroidLng, fire.centroidLat]);
      return turf.booleanPointInPolygon(point, countyPoly.geometry);

    });

    if (hit) {
      console.log("hit");
      layer.setStyle({
        fillColor: "#ff5347ff",
        fillOpacity: 0.6
      });
    }
  });
}

const countyStats = {
  "Alameda": {
    population: "1.67M",
    area: "821 mi²",
    recentFires: 7,
    droughtIndex: 0,
    riskLevel: "Low",
    report: "Alameda County, with a population of 1.67 million over 821 square miles, has experienced 7 wildfires in the past five years. Its drought index is 0, contributing to a low wildfire risk. Overall, wildfire activity remains limited due to lower drought stress and urbanized landscapes."  },
  "San Bernardino": {
    population: "2.18M",
    area: "20,105 mi²",
    recentFires: 53,
    droughtIndex: 2,
    riskLevel: "Severe",
    report: "San Bernardino County, spanning 20,105 square miles with 2.18 million residents, has experienced 53 wildfires in the last five years. With a drought index of 2, the county faces severe wildfire risk, driven by dry conditions and dense vegetation. Wildfire monitoring and preparedness are critical for this region."  }
};
