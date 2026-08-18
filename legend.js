// =========================================
// legend.js
// Adds a map legend
// =========================================

function addLegend(map) {

    // Create the legend control
    const legend = L.control({
        position: "bottomright"
    });

    // Create the legend contents
    legend.onAdd = function () {

        const div = L.DomUtil.create("div", "info legend");

        div.innerHTML = `
            <h4>📈 Invasion Risk</h4>

            <div style="margin-bottom:8px;">
                <span style="
                    display:inline-block;
                    width:18px;
                    height:18px;
                    background:#d73027;
                    border:1px solid black;
                    margin-right:8px;">
                </span>
                High Risk
            </div>

            <div style="margin-bottom:8px;">
                <span style="
                    display:inline-block;
                    width:18px;
                    height:18px;
                    background:#fdae61;
                    border:1px solid black;
                    margin-right:8px;">
                </span>
                Medium Risk
            </div>

            <div>
                <span style="
                    display:inline-block;
                    width:18px;
                    height:18px;
                    background:#1a9850;
                    border:1px solid black;
                    margin-right:8px;">
                </span>
                Low Risk
            </div>
        `;

        return div;
    };

    // Add legend to map
    legend.addTo(map);
}