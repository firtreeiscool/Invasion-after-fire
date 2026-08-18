// ============================================================
// INVASION AFTER FIRE
// script.js
//
// Features:
// - Fire polygons colored by invasion risk
// - Real environmental GIS data
// - Clustered invasive-plant observations
// - Different colors for each invasive species
// - Fire and invasive-observation popups
// - Layer controls and legends
// ============================================================


// ------------------------------------------------------------
// 1. CREATE THE MAP
// ------------------------------------------------------------

const map = L.map("map").setView(
  [39.05, -120.8],
  9
);


// ------------------------------------------------------------
// 2. CREATE CUSTOM MAP PANES
// ------------------------------------------------------------

map.createPane("firePane");
map.getPane("firePane").style.zIndex = 410;

map.createPane("invasivePane");
map.getPane("invasivePane").style.zIndex = 650;

map.getPane("popupPane").style.zIndex = 800;


// ------------------------------------------------------------
// 3. ADD OPENSTREETMAP
// ------------------------------------------------------------

const openStreetMapLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
).addTo(map);


// ------------------------------------------------------------
// 4. DATA FILE PATHS
// ------------------------------------------------------------

const DATA_FILES = {
  fires:
    "data/placer_fires.geojson",

  elevation:
    "data/placer_fires_elevation.csv",

  slope:
    "data/placer_fires_slope.csv",

  aspect:
    "data/placer_fires_aspect.csv",

  roadDistance:
    "data/placer_fires_road_distance.csv",

  rainfall:
    "data/placer_fires_rainfall.csv",

  invasiveDistance:
    "data/placer_fires_invasive_distance.csv",

  invasiveObservations:
    "data/invasive_plants.geojson"
};


// ------------------------------------------------------------
// 5. GLOBAL MAP LAYERS
// ------------------------------------------------------------

let fireLayer = null;
let invasiveClusterLayer = null;
let layerControl = null;
let invasiveLegend = null;


// ------------------------------------------------------------
// 6. PARSE ONE CSV LINE
// ------------------------------------------------------------

function parseCSVLine(line) {
  const values = [];

  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index++
  ) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (
      character === '"' &&
      insideQuotes &&
      nextCharacter === '"'
    ) {
      currentValue += '"';
      index++;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  values.push(currentValue);

  return values;
}


// ------------------------------------------------------------
// 7. PARSE CSV TEXT
// ------------------------------------------------------------

function parseCSV(text) {
  const cleanedText = text
    .replace(/^\uFEFF/, "")
    .trim();

  if (!cleanedText) {
    return [];
  }

  const lines = cleanedText
    .split(/\r?\n/)
    .filter(function(line) {
      return line.trim() !== "";
    });

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(
    lines[0]
  ).map(function(header) {
    return header.trim();
  });

  return lines
    .slice(1)
    .map(function(line) {
      const values = parseCSVLine(line);
      const row = {};

      headers.forEach(
        function(header, index) {
          row[header] =
            values[index] !== undefined
              ? values[index].trim()
              : "";
        }
      );

      return row;
    });
}


// ------------------------------------------------------------
// 8. LOAD CSV
// ------------------------------------------------------------

async function loadCSV(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `Could not load ${filePath}. HTTP status: ${response.status}`
    );
  }

  const text = await response.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    throw new Error(
      `${filePath} contains no usable rows.`
    );
  }

  return rows;
}


// ------------------------------------------------------------
// 9. LOAD JSON OR GEOJSON
// ------------------------------------------------------------

async function loadJSON(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(
      `Could not load ${filePath}. HTTP status: ${response.status}`
    );
  }

  return response.json();
}


// ------------------------------------------------------------
// 10. FIND OBJECTID IN CSV
// ------------------------------------------------------------

function getCSVObjectID(row) {
  const possibleFields = [
    "OBJECTID",
    "ObjectID",
    "objectid",
    "objectId"
  ];

  for (const field of possibleFields) {
    const value = row[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return null;
}


// ------------------------------------------------------------
// 11. CREATE OBJECTID LOOKUP
// ------------------------------------------------------------

function createLookup(
  rows,
  valueColumn
) {
  const lookup = {};

  rows.forEach(function(row) {
    const objectID = getCSVObjectID(row);

    if (!objectID) {
      return;
    }

    const numericValue =
      Number(row[valueColumn]);

    if (Number.isFinite(numericValue)) {
      lookup[objectID] = numericValue;
    }
  });

  return lookup;
}


// ------------------------------------------------------------
// 12. FIND OBJECTID IN FIRE FEATURE
// ------------------------------------------------------------

function getFeatureObjectID(properties) {
  const possibleFields = [
    "OBJECTID",
    "ObjectID",
    "objectid",
    "objectId"
  ];

  for (const field of possibleFields) {
    const value = properties[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return null;
}


// ------------------------------------------------------------
// 13. DISPLAY AND UNIT HELPERS
// ------------------------------------------------------------

function formatNumber(
  value,
  decimals = 0
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not available";
  }

  return number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }
  );
}


function metersToFeet(meters) {
  const value = Number(meters);

  return Number.isFinite(value)
    ? value * 3.28084
    : null;
}


function metersToMiles(meters) {
  const value = Number(meters);

  return Number.isFinite(value)
    ? value / 1609.344
    : null;
}


function millimetersToInches(
  millimeters
) {
  const value = Number(millimeters);

  return Number.isFinite(value)
    ? value / 25.4
    : null;
}


// ------------------------------------------------------------
// 14. ESCAPE HTML
// ------------------------------------------------------------

function escapePopupHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ------------------------------------------------------------
// 15. GET FIRST AVAILABLE PROPERTY
// ------------------------------------------------------------

function getFirstProperty(
  properties,
  fieldNames,
  fallback = "Not available"
) {
  for (const fieldName of fieldNames) {
    const value = properties[fieldName];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
}


// ------------------------------------------------------------
// 16. FIRE INFORMATION HELPERS
// ------------------------------------------------------------

function getFireName(properties) {
  return getFirstProperty(
    properties,
    [
      "FIRE_NAME",
      "FIRENAME",
      "NAME"
    ],
    "Unnamed Fire"
  );
}


function getFireYear(properties) {
  return getFirstProperty(
    properties,
    [
      "YEAR_",
      "YEAR",
      "FIRE_YEAR"
    ],
    "Unknown"
  );
}


function getAgency(properties) {
  return getFirstProperty(
    properties,
    [
      "AGENCY",
      "AGENCY_NAME"
    ],
    "Unknown"
  );
}


function getUnit(properties) {
  return getFirstProperty(
    properties,
    [
      "UNIT_ID",
      "UNIT"
    ],
    "Unknown"
  );
}


function getIncidentNumber(properties) {
  return getFirstProperty(
    properties,
    [
      "INC_NUM",
      "INCIDENT_NUMBER",
      "INCIDENTNU"
    ],
    "Not available"
  );
}


function formatDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}


function getAlarmDate(properties) {
  const rawDate = getFirstProperty(
    properties,
    [
      "ALARM_DATE",
      "ALARMDATE",
      "ALARM_DT"
    ],
    null
  );

  return formatDate(rawDate);
}


function getFireSize(properties) {
  const acreage = Number(
    getFirstProperty(
      properties,
      [
        "GIS_ACRES",
        "ACRES"
      ],
      NaN
    )
  );

  if (!Number.isFinite(acreage)) {
    return "Not available";
  }

  return `${acreage.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 1
    }
  )} acres`;
}


// ------------------------------------------------------------
// 17. ASPECT DIRECTION
// ------------------------------------------------------------

function getAspectDirection(aspect) {
  const degrees = Number(aspect);

  if (!Number.isFinite(degrees)) {
    return "Not available";
  }

  const normalized =
    ((degrees % 360) + 360) % 360;

  if (
    normalized >= 337.5 ||
    normalized < 22.5
  ) {
    return "North";
  }

  if (normalized < 67.5) {
    return "Northeast";
  }

  if (normalized < 112.5) {
    return "East";
  }

  if (normalized < 157.5) {
    return "Southeast";
  }

  if (normalized < 202.5) {
    return "South";
  }

  if (normalized < 247.5) {
    return "Southwest";
  }

  if (normalized < 292.5) {
    return "West";
  }

  return "Northwest";
}


// ------------------------------------------------------------
// 18. GET OBSERVATION SPECIES
// ------------------------------------------------------------

function getObservationSpecies(
  properties
) {
  return getFirstProperty(
    properties,
    [
      "species",
      "scientificName",
      "verbatimScientificName"
    ],
    "Unknown species"
  );
}


function normalizeSpeciesName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}


// ------------------------------------------------------------
// 19. SPECIES COLOR
// ------------------------------------------------------------

function getInvasiveSpeciesColor(
  scientificName
) {
  const name =
    normalizeSpeciesName(
      scientificName
    );

  if (
    name.includes(
      "centaurea solstitialis"
    )
  ) {
    return "#f4c430";
  }

  if (
    name.includes(
      "bromus tectorum"
    )
  ) {
    return "#e76f00";
  }

  if (
    name.includes(
      "taeniatherum caput-medusae"
    )
  ) {
    return "#8e44ad";
  }

  if (
    name.includes(
      "cytisus scoparius"
    )
  ) {
    return "#159447";
  }

  if (
    name.includes(
      "rubus armeniacus"
    )
  ) {
    return "#2868c7";
  }

  if (
    name.includes(
      "ailanthus altissima"
    )
  ) {
    return "#df2771";
  }

  return "#666666";
}


// ------------------------------------------------------------
// 20. SPECIES COMMON NAME
// ------------------------------------------------------------

function getInvasiveCommonName(
  scientificName
) {
  const name =
    normalizeSpeciesName(
      scientificName
    );

  if (
    name.includes(
      "centaurea solstitialis"
    )
  ) {
    return "Yellow Starthistle";
  }

  if (
    name.includes(
      "bromus tectorum"
    )
  ) {
    return "Cheatgrass";
  }

  if (
    name.includes(
      "taeniatherum caput-medusae"
    )
  ) {
    return "Medusahead";
  }

  if (
    name.includes(
      "cytisus scoparius"
    )
  ) {
    return "Scotch Broom";
  }

  if (
    name.includes(
      "rubus armeniacus"
    )
  ) {
    return "Himalayan Blackberry";
  }

  if (
    name.includes(
      "ailanthus altissima"
    )
  ) {
    return "Tree of Heaven";
  }

  return "Other Invasive Plant";
}


// ------------------------------------------------------------
// 21. SHORTEN OCCURRENCE ID
// ------------------------------------------------------------

function shortenOccurrenceID(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const text = String(value);

  const observationMatch =
    text.match(
      /observations\/(\d+)/
    );

  if (observationMatch) {
    return `iNaturalist #${observationMatch[1]}`;
  }

  if (text.length > 45) {
    return `${text.slice(0, 42)}...`;
  }

  return text;
}


// ------------------------------------------------------------
// 22. INVASIVE OBSERVATION POPUP
// ------------------------------------------------------------

function createInvasivePopup(
  properties
) {
  const speciesName =
    getObservationSpecies(
      properties
    );

  const scientificName =
    getFirstProperty(
      properties,
      [
        "scientificName",
        "species"
      ],
      speciesName
    );

  const commonName =
    getInvasiveCommonName(
      speciesName
    );

  const observationDate =
    formatDate(
      getFirstProperty(
        properties,
        [
          "eventDate",
          "dateIdentified"
        ],
        null
      )
    );

  const observer =
    getFirstProperty(
      properties,
      [
        "recordedBy",
        "identifiedBy"
      ],
      "Not available"
    );

  const basisOfRecord =
    getFirstProperty(
      properties,
      ["basisOfRecord"],
      "Not available"
    );

  const datasetName =
    getFirstProperty(
      properties,
      [
        "datasetName",
        "institutionCode",
        "collectionCode"
      ],
      "GBIF occurrence dataset"
    );

  const occurrenceID =
    shortenOccurrenceID(
      getFirstProperty(
        properties,
        [
          "occurrenceID",
          "gbifID"
        ],
        ""
      )
    );

  const uncertainty = Number(
    getFirstProperty(
      properties,
      [
        "coordinateUncertaintyInMeters"
      ],
      NaN
    )
  );

  return `
    <div class="invasive-popup">

      <h3>
        ${escapePopupHTML(
          commonName
        )}
      </h3>

      <p class="scientific-name">
        <em>
          ${escapePopupHTML(
            scientificName
          )}
        </em>
      </p>

      <div class="observation-detail">

        <span>Observation date</span>

        <strong>
          ${escapePopupHTML(
            observationDate
          )}
        </strong>

      </div>

      <div class="observation-detail">

        <span>Observer</span>

        <strong>
          ${escapePopupHTML(observer)}
        </strong>

      </div>

      <div class="observation-detail">

        <span>Record type</span>

        <strong>
          ${escapePopupHTML(
            basisOfRecord
          )}
        </strong>

      </div>

      <div class="observation-detail">

        <span>Dataset</span>

        <strong>
          ${escapePopupHTML(
            datasetName
          )}
        </strong>

      </div>

      ${
        Number.isFinite(uncertainty)
          ? `
            <div class="observation-detail">

              <span>
                Coordinate uncertainty
              </span>

              <strong>
                ${formatNumber(
                  uncertainty
                )} m
              </strong>

            </div>
          `
          : ""
      }

      <div class="observation-detail">

        <span>Record ID</span>

        <strong>
          ${escapePopupHTML(
            occurrenceID
          )}
        </strong>

      </div>

    </div>
  `;
}


// ------------------------------------------------------------
// 23. CREATE A SINGLE INVASIVE MARKER
// ------------------------------------------------------------

function createInvasiveMarker(
  feature
) {
  if (
    !feature ||
    !feature.geometry ||
    feature.geometry.type !== "Point"
  ) {
    return null;
  }

  const coordinates =
    feature.geometry.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null;
  }

  const longitude =
    Number(coordinates[0]);

  const latitude =
    Number(coordinates[1]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const properties =
    feature.properties || {};

  const speciesName =
    getObservationSpecies(
      properties
    );

  const color =
    getInvasiveSpeciesColor(
      speciesName
    );

  const marker =
    L.circleMarker(
      [latitude, longitude],
      {
        pane: "invasivePane",

        radius: 5,

        color: "#ffffff",

        weight: 1.5,

        opacity: 1,

        fillColor: color,

        fillOpacity: 0.92
      }
    );

  marker.bindPopup(
    createInvasivePopup(
      properties
    ),
    {
      maxWidth: 330
    }
  );

  marker.on(
    "mouseover",
    function() {
      marker.setRadius(8);

      marker.setStyle({
        weight: 2.5,
        fillOpacity: 1
      });
    }
  );

  marker.on(
    "mouseout",
    function() {
      marker.setRadius(5);

      marker.setStyle({
        weight: 1.5,
        fillOpacity: 0.92
      });
    }
  );

  return marker;
}


// ------------------------------------------------------------
// 24. CREATE CLUSTERED INVASIVE LAYER
// ------------------------------------------------------------

function createInvasiveClusterLayer(
  invasiveGeoJSON
) {
  if (
    typeof L.markerClusterGroup !==
    "function"
  ) {
    throw new Error(
      "Leaflet.markercluster was not loaded. Check index.html."
    );
  }

  if (
    !invasiveGeoJSON ||
    !Array.isArray(
      invasiveGeoJSON.features
    )
  ) {
    throw new Error(
      "The invasive GeoJSON does not contain a valid features array."
    );
  }

  const clusterGroup =
    L.markerClusterGroup({
      showCoverageOnHover: false,

      zoomToBoundsOnClick: true,

      spiderfyOnMaxZoom: true,

      removeOutsideVisibleBounds: true,

      animate: true,

      animateAddingMarkers: false,

      disableClusteringAtZoom: 14,

      maxClusterRadius: 45,

      spiderfyDistanceMultiplier: 1.4,

      chunkedLoading: true,

      chunkInterval: 100,

      chunkDelay: 25
    });

  let markerCount = 0;

  invasiveGeoJSON.features.forEach(
    function(feature) {
      const marker =
        createInvasiveMarker(feature);

      if (!marker) {
        return;
      }

      clusterGroup.addLayer(marker);
      markerCount++;
    }
  );

  console.log(
    "Clustered invasive markers:",
    markerCount
  );

  return clusterGroup;
}


// ------------------------------------------------------------
// 25. FIRE POPUP
// ------------------------------------------------------------

function createFirePopup(
  feature,
  riskResult
) {
  const properties =
    feature.properties || {};

  const elevation =
    Number(properties.elev_mean);

  const slope =
    Number(properties.slope_mean);

  const aspect =
    Number(properties.aspect_mean);

  const roadDistance =
    Number(
      properties.road_dist_mean
    );

  const rainfall =
    Number(
      properties.rainfall_mean
    );

  const invasiveDistance =
    Number(
      properties.invasive_dist_mean
    );

  const elevationFeet =
    metersToFeet(elevation);

  const roadMiles =
    metersToMiles(roadDistance);

  const rainfallInches =
    millimetersToInches(rainfall);

  const invasiveMiles =
    metersToMiles(
      invasiveDistance
    );

  return `
    <div class="fire-popup">

      <h3>
        ${escapePopupHTML(
          getFireName(properties)
        )}
      </h3>

      <p>
        <strong>Year:</strong>
        ${escapePopupHTML(
          getFireYear(properties)
        )}
      </p>

      <p>
        <strong>Agency:</strong>
        ${escapePopupHTML(
          getAgency(properties)
        )}
      </p>

      <p>
        <strong>Unit:</strong>
        ${escapePopupHTML(
          getUnit(properties)
        )}
      </p>

      <p>
        <strong>
          Incident number:
        </strong>

        ${escapePopupHTML(
          getIncidentNumber(
            properties
          )
        )}
      </p>

      <p>
        <strong>Alarm date:</strong>
        ${escapePopupHTML(
          getAlarmDate(properties)
        )}
      </p>

      <p>
        <strong>Fire size:</strong>
        ${escapePopupHTML(
          getFireSize(properties)
        )}
      </p>

      <hr>

      <p>
        <strong>Mean elevation:</strong>

        ${
          Number.isFinite(elevation)
            ? `${formatNumber(
                elevation
              )} m`
            : "Not available"
        }

        ${
          elevationFeet !== null
            ? `
              <br>
              <small>
                ${formatNumber(
                  elevationFeet
                )} ft
              </small>
            `
            : ""
        }
      </p>

      <p>
        <strong>Mean slope:</strong>

        ${
          Number.isFinite(slope)
            ? `${formatNumber(
                slope,
                1
              )}°`
            : "Not available"
        }
      </p>

      <p>
        <strong>Mean aspect:</strong>

        ${escapePopupHTML(
          getAspectDirection(aspect)
        )}

        ${
          Number.isFinite(aspect)
            ? `
              <br>
              <small>
                ${formatNumber(
                  aspect,
                  1
                )}°
              </small>
            `
            : ""
        }
      </p>

      <p>
        <strong>
          Mean distance to roads:
        </strong>

        ${
          Number.isFinite(
            roadDistance
          )
            ? `${formatNumber(
                roadDistance
              )} m`
            : "Not available"
        }

        ${
          roadMiles !== null
            ? `
              <br>
              <small>
                ${formatNumber(
                  roadMiles,
                  2
                )} mi
              </small>
            `
            : ""
        }
      </p>

      <p>
        <strong>
          Mean annual rainfall:
        </strong>

        ${
          Number.isFinite(rainfall)
            ? `${formatNumber(
                rainfall
              )} mm/year`
            : "Not available"
        }

        ${
          rainfallInches !== null
            ? `
              <br>
              <small>
                ${formatNumber(
                  rainfallInches,
                  1
                )} in/year
              </small>
            `
            : ""
        }
      </p>

      <p>
        <strong>
          Mean distance to nearest invasive observation:
        </strong>

        ${
          Number.isFinite(
            invasiveDistance
          )
            ? `${formatNumber(
                invasiveDistance
              )} m`
            : "Not available"
        }

        ${
          invasiveMiles !== null
            ? `
              <br>
              <small>
                ${formatNumber(
                  invasiveMiles,
                  2
                )} mi
              </small>
            `
            : ""
        }
      </p>

      <hr>

      <p>
        <strong>
          Invasion risk score:
        </strong>

        ${escapePopupHTML(
          riskResult.score
        )}/${escapePopupHTML(
          riskResult.maximumScore
        )}
      </p>

      <p>
        <strong>Risk level:</strong>

        ${escapePopupHTML(
          riskResult.level
        )}
      </p>

    </div>
  `;
}


// ------------------------------------------------------------
// 26. JOIN GIS VALUES TO FIRE FEATURES
// ------------------------------------------------------------

function joinEnvironmentalData(
  fireGeoJSON,
  elevationLookup,
  slopeLookup,
  aspectLookup,
  roadLookup,
  rainfallLookup,
  invasiveLookup
) {
  const counters = {
    elevationMatched: 0,
    slopeMatched: 0,
    aspectMatched: 0,
    roadMatched: 0,
    rainfallMatched: 0,
    invasiveMatched: 0
  };

  fireGeoJSON.features.forEach(
    function(feature) {
      if (!feature.properties) {
        feature.properties = {};
      }

      const properties =
        feature.properties;

      const objectID =
        getFeatureObjectID(
          properties
        );

      const elevation =
        objectID
          ? elevationLookup[objectID]
          : undefined;

      properties.elev_mean =
        Number.isFinite(elevation)
          ? elevation
          : null;

      if (Number.isFinite(elevation)) {
        counters.elevationMatched++;
      }


      const slope =
        objectID
          ? slopeLookup[objectID]
          : undefined;

      properties.slope_mean =
        Number.isFinite(slope)
          ? slope
          : null;

      if (Number.isFinite(slope)) {
        counters.slopeMatched++;
      }


      const aspect =
        objectID
          ? aspectLookup[objectID]
          : undefined;

      properties.aspect_mean =
        Number.isFinite(aspect)
          ? aspect
          : null;

      if (Number.isFinite(aspect)) {
        counters.aspectMatched++;
      }


      const roadDistance =
        objectID
          ? roadLookup[objectID]
          : undefined;

      properties.road_dist_mean =
        Number.isFinite(
          roadDistance
        )
          ? roadDistance
          : null;

      if (
        Number.isFinite(
          roadDistance
        )
      ) {
        counters.roadMatched++;
      }


      const rainfall =
        objectID
          ? rainfallLookup[objectID]
          : undefined;

      properties.rainfall_mean =
        Number.isFinite(rainfall)
          ? rainfall
          : null;

      if (Number.isFinite(rainfall)) {
        counters.rainfallMatched++;
      }


      const invasiveDistance =
        objectID
          ? invasiveLookup[objectID]
          : undefined;

      properties.invasive_dist_mean =
        Number.isFinite(
          invasiveDistance
        )
          ? invasiveDistance
          : null;

      if (
        Number.isFinite(
          invasiveDistance
        )
      ) {
        counters.invasiveMatched++;
      }
    }
  );

  return counters;
}


// ------------------------------------------------------------
// 27. CREATE FIRE LAYER
// ------------------------------------------------------------

function createFireLayer(
  fireGeoJSON
) {
  return L.geoJSON(
    fireGeoJSON,
    {
      pane: "firePane",

      style:
        function(feature) {
          const properties =
            feature.properties || {};

          const riskResult =
            typeof calculateRisk ===
            "function"
              ? calculateRisk(
                  properties
                )
              : {
                  score: 0,
                  maximumScore: 70,
                  percentage: 0,
                  level: "Unknown",
                  breakdown: {}
                };

          const color =
            typeof getFireColor ===
            "function"
              ? getFireColor(
                  riskResult.score
                )
              : "#808080";

          return {
            pane: "firePane",
            color: color,
            weight: 2,
            opacity: 1,
            fillColor: color,
            fillOpacity: 0.55
          };
        },

      onEachFeature:
        function(
          feature,
          polygonLayer
        ) {
          const properties =
            feature.properties || {};

          const riskResult =
            typeof calculateRisk ===
            "function"
              ? calculateRisk(
                  properties
                )
              : {
                  score: 0,
                  maximumScore: 70,
                  percentage: 0,
                  level: "Unknown",
                  breakdown: {}
                };

          polygonLayer.bindPopup(
            createFirePopup(
              feature,
              riskResult
            ),
            {
              maxWidth: 370
            }
          );

          polygonLayer.on(
            "click",
            function() {
              if (
                typeof updateSidebar ===
                "function"
              ) {
                updateSidebar(
                  properties,
                  riskResult
                );
              }
            }
          );

          polygonLayer.on(
            "mouseover",
            function() {
              polygonLayer.setStyle({
                weight: 4,
                fillOpacity: 0.75
              });
            }
          );

          polygonLayer.on(
            "mouseout",
            function() {
              if (fireLayer) {
                fireLayer.resetStyle(
                  polygonLayer
                );
              }
            }
          );
        }
    }
  );
}


// ------------------------------------------------------------
// 28. INVASIVE SPECIES LEGEND
// ------------------------------------------------------------

function addInvasiveSpeciesLegend() {
  const legend =
    L.control({
      position: "bottomleft"
    });

  legend.onAdd =
    function() {
      const div =
        L.DomUtil.create(
          "div",
          "invasive-species-legend"
        );

      const species = [
        [
          "Yellow Starthistle",
          "Centaurea solstitialis"
        ],
        [
          "Cheatgrass",
          "Bromus tectorum"
        ],
        [
          "Medusahead",
          "Taeniatherum caput-medusae"
        ],
        [
          "Scotch Broom",
          "Cytisus scoparius"
        ],
        [
          "Himalayan Blackberry",
          "Rubus armeniacus"
        ],
        [
          "Tree of Heaven",
          "Ailanthus altissima"
        ]
      ];

      div.innerHTML =
        "<h4>Invasive Observations</h4>";

      species.forEach(
        function(item) {
          const commonName = item[0];
          const scientificName = item[1];

          const color =
            getInvasiveSpeciesColor(
              scientificName
            );

          div.innerHTML += `
            <div class="invasive-legend-row">

              <span
                class="invasive-legend-dot"
                style="background:${color};"
              ></span>

              <span>
                ${escapePopupHTML(
                  commonName
                )}
              </span>

            </div>
          `;
        }
      );

      L.DomEvent.disableClickPropagation(
        div
      );

      L.DomEvent.disableScrollPropagation(
        div
      );

      return div;
    };

  legend.addTo(map);

  return legend;
}


// ------------------------------------------------------------
// 29. INITIALIZE APPLICATION
// ------------------------------------------------------------

async function initializeApplication() {
  try {
    const [
      fireGeoJSON,
      elevationRows,
      slopeRows,
      aspectRows,
      roadRows,
      rainfallRows,
      invasiveDistanceRows,
      invasiveObservationGeoJSON
    ] = await Promise.all([
      loadJSON(
        DATA_FILES.fires
      ),

      loadCSV(
        DATA_FILES.elevation
      ),

      loadCSV(
        DATA_FILES.slope
      ),

      loadCSV(
        DATA_FILES.aspect
      ),

      loadCSV(
        DATA_FILES.roadDistance
      ),

      loadCSV(
        DATA_FILES.rainfall
      ),

      loadCSV(
        DATA_FILES.invasiveDistance
      ),

      loadJSON(
        DATA_FILES.invasiveObservations
      )
    ]);


    if (
      !fireGeoJSON ||
      !Array.isArray(
        fireGeoJSON.features
      )
    ) {
      throw new Error(
        "Fire GeoJSON is invalid."
      );
    }


    const elevationLookup =
      createLookup(
        elevationRows,
        "elev_mean"
      );

    const slopeLookup =
      createLookup(
        slopeRows,
        "slope_mean"
      );

    const aspectLookup =
      createLookup(
        aspectRows,
        "aspect_mean"
      );

    const roadLookup =
      createLookup(
        roadRows,
        "road_dist_mean"
      );

    const rainfallLookup =
      createLookup(
        rainfallRows,
        "rainfall_mean"
      );

    const invasiveLookup =
      createLookup(
        invasiveDistanceRows,
        "invasive_dist_mean"
      );


    const counters =
      joinEnvironmentalData(
        fireGeoJSON,
        elevationLookup,
        slopeLookup,
        aspectLookup,
        roadLookup,
        rainfallLookup,
        invasiveLookup
      );


    fireLayer =
      createFireLayer(
        fireGeoJSON
      );

    invasiveClusterLayer =
      createInvasiveClusterLayer(
        invasiveObservationGeoJSON
      );


    fireLayer.addTo(map);


    // Invasive observations are intentionally hidden at first.
    // Users can enable them through the layer control.

    const fireBounds =
      fireLayer.getBounds();

    if (fireBounds.isValid()) {
      map.fitBounds(
        fireBounds,
        {
          padding: [20, 20]
        }
      );
    }


    const baseLayers = {
      OpenStreetMap:
        openStreetMapLayer
    };

    const overlayLayers = {
      "Fire Risk Polygons":
        fireLayer,

      "Invasive Plant Observations":
        invasiveClusterLayer
    };


    layerControl =
      L.control.layers(
        baseLayers,
        overlayLayers,
        {
          collapsed: false
        }
      ).addTo(map);


    if (
      typeof addLegend ===
      "function"
    ) {
      addLegend(map);
    } else if (
      typeof createLegend ===
      "function"
    ) {
      createLegend(map);
    }


    invasiveLegend =
      addInvasiveSpeciesLegend();


    // Show or hide the species legend with the point layer.

    map.on(
      "overlayadd",
      function(event) {
        if (
          event.layer ===
          invasiveClusterLayer
        ) {
          if (!invasiveLegend) {
            invasiveLegend =
              addInvasiveSpeciesLegend();
          }
        }
      }
    );


    map.on(
      "overlayremove",
      function(event) {
        if (
          event.layer ===
          invasiveClusterLayer &&
          invasiveLegend
        ) {
          map.removeControl(
            invasiveLegend
          );

          invasiveLegend = null;
        }
      }
    );


    console.log(
      "Fire polygons:",
      fireGeoJSON.features.length
    );

    console.log(
      "Elevation matched:",
      counters.elevationMatched
    );

    console.log(
      "Slope matched:",
      counters.slopeMatched
    );

    console.log(
      "Aspect matched:",
      counters.aspectMatched
    );

    console.log(
      "Road distance matched:",
      counters.roadMatched
    );

    console.log(
      "Rainfall matched:",
      counters.rainfallMatched
    );

    console.log(
      "Invasive distance matched:",
      counters.invasiveMatched
    );

    console.log(
      "Invasive GeoJSON observations:",
      invasiveObservationGeoJSON
        .features
        .length
    );

  } catch (error) {
    console.error(
      "Application initialization failed:",
      error
    );

    alert(
      "The map could not be loaded. Open the browser console for details."
    );
  }
}


// ------------------------------------------------------------
// 30. START APPLICATION
// ------------------------------------------------------------

initializeApplication();