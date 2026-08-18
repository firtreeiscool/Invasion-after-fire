// =====================================================
// Restoration Recommendations Database
// =====================================================

const restorationData = {

    "CATLETT": {

        nativePlants: [
            "Blue Oak",
            "California Buckeye",
            "Purple Needlegrass"
        ],

        invasivePlants: [
            "Yellow Starthistle",
            "Cheatgrass"
        ],

        risk: "Medium"

    },

    "MOSQUITO": {

        nativePlants: [
            "Ponderosa Pine",
            "White Fir",
            "Mule Ears"
        ],

        invasivePlants: [
            "Scotch Broom"
        ],

        risk: "High"

    }

};


// =====================================================
// Return a color based on invasion risk
// =====================================================

function getRiskColor(risk) {

    if (risk === "High") {
        return "red";
    }

    if (risk === "Medium") {
        return "orange";
    }

    if (risk === "Low") {
        return "green";
    }

    return "gray";

}


// =====================================================
// Create the map
// =====================================================

const map = L.map('map').setView([39.05, -120.8], 9);


// =====================================================
// Add OpenStreetMap
// =====================================================

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// =====================================================
// Load Fire GeoJSON
// =====================================================

fetch("data/placer_fires.geojson")

    .then(response => response.json())

    .then(data => {

        const fires = L.geoJSON(data, {

            // =========================================
            // Color polygons by invasion risk
            // =========================================

            style: function(feature) {

                const fire = restorationData[feature.properties.FIRE_NAME];

                let risk = "Unknown";

                if (fire) {
                    risk = fire.risk;
                }

                return {

                    color: getRiskColor(risk),

                    weight: 2,

                    fillColor: getRiskColor(risk),

                    fillOpacity: 0.6

                };

            },


            // =========================================
            // Runs once for every fire
            // =========================================

            onEachFeature: function(feature, layer) {

                // Get restoration data

                const fire = restorationData[feature.properties.FIRE_NAME];

                let nativePlants = "No recommendations available";
                let invasivePlants = "No recommendations available";
                let risk = "Unknown";

                if (fire) {

                    nativePlants = fire.nativePlants.join("<br>");

                    invasivePlants = fire.invasivePlants.join("<br>");

                    risk = fire.risk;

                }


                // =====================================
                // Popup
                // =====================================

                layer.bindPopup(`

                    <h3>🔥 ${feature.properties.FIRE_NAME} FIRE</h3>

                    <p><b>📅 Year:</b> ${feature.properties.YEAR_}</p>

                    <p><b>🚒 Agency:</b> ${feature.properties.AGENCY}</p>

                    <p><b>🏢 Unit:</b> ${feature.properties.UNIT_ID}</p>

                    <p><b>📅 Alarm Date:</b><br>
                    ${feature.properties.ALARM_DATE}</p>

                    <p><b>🔥 Fire ID:</b>
                    ${feature.properties.INC_NUM}</p>

                    <hr>

                    <p><b>📈 Invasion Risk:</b>
                    ${risk}</p>

                `);


                // =====================================
                // Hover Effect
                // =====================================

                layer.on("mouseover", function() {

                    layer.setStyle({

                        weight: 4,

                        fillOpacity: 0.9

                    });

                });

                layer.on("mouseout", function() {

                    fires.resetStyle(layer);

                });


                // =====================================
                // Sidebar
                // =====================================

                layer.on("click", function() {

                    document.getElementById("sidebar").innerHTML = `

                        <h2>🔥 Fire Information</h2>

                        <h3>${feature.properties.FIRE_NAME} FIRE</h3>

                        <hr>

                        <p><b>📅 Year:</b> ${feature.properties.YEAR_}</p>

                        <p><b>🚒 Agency:</b> ${feature.properties.AGENCY}</p>

                        <p><b>🏢 Unit:</b> ${feature.properties.UNIT_ID}</p>

                        <p><b>📅 Alarm Date:</b><br>
                        ${feature.properties.ALARM_DATE}</p>

                        <p><b>🔥 Fire ID:</b>
                        ${feature.properties.INC_NUM}</p>

                        <hr>

                        <h3>🌱 Recommended Native Plants</h3>

                        <p>${nativePlants}</p>

                        <hr>

                        <h3>⚠ Likely Invasive Plants</h3>

                        <p>${invasivePlants}</p>

                        <hr>

                        <h3>📈 Invasion Risk</h3>

                        <p><b>${risk}</b></p>

                    `;

                });

            }

        }).addTo(map);

        // Zoom to all fires

        map.fitBounds(fires.getBounds());

    })

    .catch(error => {

        console.error(error);

        alert("Could not load placer_fires.geojson");

    });