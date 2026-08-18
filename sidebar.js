// ============================================================
// INVASION AFTER FIRE
// sidebar.js
//
// Displays:
// - Fire information
// - Environmental GIS conditions
// - Invasion-risk summary
// - Risk-factor details
// - Nearby invasive-plant information
// - Detailed candidate native-species recommendations
// - Data-source information
//
// Required file order in index.html:
//
// risk.js
// plant.js
// sidebar.js
// legend.js
// script.js
// ============================================================

"use strict";


// ------------------------------------------------------------
// 1. GENERAL DISPLAY HELPERS
// ------------------------------------------------------------

function sidebarFormatNumber(
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
      minimumFractionDigits:
        decimals,

      maximumFractionDigits:
        decimals
    }
  );
}


function sidebarMetersToFeet(meters) {
  const number = Number(meters);

  return Number.isFinite(number)
    ? number * 3.28084
    : null;
}


function sidebarMetersToMiles(meters) {
  const number = Number(meters);

  return Number.isFinite(number)
    ? number / 1609.344
    : null;
}


function sidebarMillimetersToInches(
  millimeters
) {
  const number = Number(millimeters);

  return Number.isFinite(number)
    ? number / 25.4
    : null;
}


// ------------------------------------------------------------
// 2. HTML SAFETY
// ------------------------------------------------------------

function escapeSidebarHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ------------------------------------------------------------
// 3. PROPERTY HELPER
// ------------------------------------------------------------

function getSidebarProperty(
  properties,
  fieldNames,
  fallback = "Not available"
) {
  for (const fieldName of fieldNames) {
    const value =
      properties[fieldName];

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
// 4. FIRE INFORMATION HELPERS
// ------------------------------------------------------------

function sidebarFireName(properties) {
  return getSidebarProperty(
    properties,
    [
      "FIRE_NAME",
      "FIRENAME",
      "NAME"
    ],
    "Unnamed Fire"
  );
}


function sidebarFireYear(properties) {
  return getSidebarProperty(
    properties,
    [
      "YEAR_",
      "YEAR",
      "FIRE_YEAR"
    ],
    "Unknown"
  );
}


function sidebarAgency(properties) {
  return getSidebarProperty(
    properties,
    [
      "AGENCY",
      "AGENCY_NAME"
    ],
    "Unknown"
  );
}


function sidebarUnit(properties) {
  return getSidebarProperty(
    properties,
    [
      "UNIT_ID",
      "UNIT"
    ],
    "Unknown"
  );
}


function sidebarIncidentNumber(
  properties
) {
  return getSidebarProperty(
    properties,
    [
      "INC_NUM",
      "INCIDENT_NUMBER",
      "INCIDENTNU"
    ],
    "Not available"
  );
}


function sidebarAlarmDate(properties) {
  const rawDate =
    getSidebarProperty(
      properties,
      [
        "ALARM_DATE",
        "ALARMDATE",
        "ALARM_DT"
      ],
      null
    );

  if (
    rawDate === null ||
    rawDate === undefined ||
    rawDate === ""
  ) {
    return "Not available";
  }

  const date = new Date(rawDate);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(rawDate);
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


function sidebarFireSize(properties) {
  const acreage =
    Number(
      getSidebarProperty(
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
// 5. ASPECT DIRECTION
// ------------------------------------------------------------

function sidebarAspectDirection(aspect) {
  const degrees = Number(aspect);

  if (!Number.isFinite(degrees)) {
    return "Not available";
  }

  const normalized =
    ((degrees % 360) + 360) %
    360;

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
// 6. RISK CSS CLASS
// ------------------------------------------------------------

function getSidebarRiskClass(level) {
  const normalized =
    String(level || "")
      .trim()
      .toLowerCase();

  if (normalized === "high") {
    return "risk-high";
  }

  if (
    normalized === "moderate" ||
    normalized === "medium"
  ) {
    return "risk-moderate";
  }

  if (normalized === "low") {
    return "risk-low";
  }

  return "risk-unknown";
}


// ------------------------------------------------------------
// 7. DATA-SOURCE CSS CLASS
// ------------------------------------------------------------

function getSidebarSourceClass(source) {
  const normalized =
    String(source || "")
      .trim()
      .toLowerCase();

  if (normalized.includes("gbif")) {
    return "data-gbif";
  }

  if (normalized.includes("real")) {
    return "data-real";
  }

  if (
    normalized.includes(
      "calculated"
    )
  ) {
    return "data-calculated";
  }

  if (
    normalized.includes(
      "simulated"
    )
  ) {
    return "data-simulated";
  }

  return "data-unknown";
}


// ------------------------------------------------------------
// 8. DETAIL ROW
// ------------------------------------------------------------

function createSidebarDetailRow(
  label,
  value
) {
  return `
    <div class="sidebar-detail-row">

      <span class="sidebar-detail-label">
        ${escapeSidebarHTML(label)}
      </span>

      <strong class="sidebar-detail-value">
        ${escapeSidebarHTML(value)}
      </strong>

    </div>
  `;
}


// ------------------------------------------------------------
// 9. ENVIRONMENTAL CONDITION CARD
// ------------------------------------------------------------

function createEnvironmentalRow(
  label,
  primaryValue,
  secondaryValue = ""
) {
  return `
    <div class="environment-item">

      <div class="environment-label">
        ${escapeSidebarHTML(label)}
      </div>

      <div class="environment-value">
        ${escapeSidebarHTML(
          primaryValue
        )}
      </div>

      ${
        secondaryValue
          ? `
            <div class="secondary-value">
              ${escapeSidebarHTML(
                secondaryValue
              )}
            </div>
          `
          : ""
      }

    </div>
  `;
}


// ------------------------------------------------------------
// 10. RISK-FACTOR CARD
// ------------------------------------------------------------

function createRiskFactorCard(factor) {
  if (
    !factor ||
    typeof factor !== "object"
  ) {
    return "";
  }

  const label =
    factor.label ||
    "Unknown Factor";

  const points =
    Number(factor.points);

  const maximumPoints =
    Number(
      factor.maximumPoints
    );

  const pointsText =
    Number.isFinite(points) &&
    Number.isFinite(maximumPoints)
      ? `${points}/${maximumPoints}`
      : "Not available";

  const progressPercentage =
    Number.isFinite(points) &&
    Number.isFinite(maximumPoints) &&
    maximumPoints > 0
      ? Math.min(
          Math.max(
            (
              points /
              maximumPoints
            ) * 100,
            0
          ),
          100
        )
      : 0;

  const displayValue =
    factor.displayValue ||
    "Not available";

  const explanation =
    factor.explanation ||
    "No explanation is available.";

  const source =
    factor.source ||
    "Unknown";

  const sourceClass =
    getSidebarSourceClass(source);

  return `
    <div class="risk-factor-card">

      <div class="risk-factor-header">

        <div>

          <h4>
            ${escapeSidebarHTML(
              label
            )}
          </h4>

          <span class="data-source-badge ${sourceClass}">
            ${escapeSidebarHTML(
              source
            )}
          </span>

        </div>

        <div class="risk-factor-score">
          ${escapeSidebarHTML(
            pointsText
          )}
        </div>

      </div>

      <div class="risk-factor-value">
        ${escapeSidebarHTML(
          displayValue
        )}
      </div>

      <div class="factor-progress-track">

        <div
          class="factor-progress-fill"
          style="width: ${progressPercentage}%"
        ></div>

      </div>

      <p class="risk-factor-explanation">
        ${escapeSidebarHTML(
          explanation
        )}
      </p>

    </div>
  `;
}


// ============================================================
// NATIVE-PLANT RECOMMENDATION HELPERS
// ============================================================


// ------------------------------------------------------------
// 11. PLANT MATCH CLASS
// ------------------------------------------------------------

function getNativePlantMatchClass(
  matchPercentage
) {
  const match =
    Number(matchPercentage);

  if (match >= 90) {
    return "plant-match-excellent";
  }

  if (match >= 75) {
    return "plant-match-good";
  }

  if (match >= 60) {
    return "plant-match-moderate";
  }

  return "plant-match-low";
}


// ------------------------------------------------------------
// 12. PLANT MATCH LABEL
// ------------------------------------------------------------

function getNativePlantMatchLabel(
  matchPercentage
) {
  const match =
    Number(matchPercentage);

  if (match >= 90) {
    return "Excellent candidate";
  }

  if (match >= 75) {
    return "Good candidate";
  }

  if (match >= 60) {
    return "Moderate candidate";
  }

  return "Needs further review";
}


// ------------------------------------------------------------
// 13. RANGE TEXT
// ------------------------------------------------------------

function createPlantRangeText(
  minimum,
  maximum,
  unit
) {
  const min = Number(minimum);
  const max = Number(maximum);

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max)
  ) {
    return "Not available";
  }

  return (
    `${sidebarFormatNumber(min)}–` +
    `${sidebarFormatNumber(max)} ${unit}`
  );
}


// ------------------------------------------------------------
// 14. RATING TEXT
// ------------------------------------------------------------

function createPlantRatingText(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return "Not available";
  }

  if (rating >= 5) {
    return "Excellent";
  }

  if (rating >= 4) {
    return "High";
  }

  if (rating >= 3) {
    return "Moderate";
  }

  if (rating >= 2) {
    return "Low";
  }

  return "Very low";
}


// ------------------------------------------------------------
// 15. ECOLOGICAL DETAIL ROW
// ------------------------------------------------------------

function createPlantEcologicalRow(
  label,
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  return `
    <div class="plant-ecological-row">

      <span class="plant-ecological-label">
        ${escapeSidebarHTML(label)}
      </span>

      <strong class="plant-ecological-value">
        ${escapeSidebarHTML(value)}
      </strong>

    </div>
  `;
}


// ------------------------------------------------------------
// 16. COMPONENT SCORE BAR
// ------------------------------------------------------------

function createPlantComponentScore(
  label,
  score
) {
  const numericScore =
    Number(score);

  if (
    !Number.isFinite(
      numericScore
    )
  ) {
    return "";
  }

  const safeScore =
    Math.min(
      Math.max(
        numericScore,
        0
      ),
      100
    );

  return `
    <div class="plant-component-score">

      <div class="plant-component-heading">

        <span>
          ${escapeSidebarHTML(label)}
        </span>

        <strong>
          ${escapeSidebarHTML(
            Math.round(safeScore)
          )}%
        </strong>

      </div>

      <div class="plant-component-track">

        <div
          class="plant-component-fill"
          style="width: ${safeScore}%"
        ></div>

      </div>

    </div>
  `;
}


// ------------------------------------------------------------
// 17. PLANT REASON LIST
// ------------------------------------------------------------

function createNativePlantReasonList(
  reasons
) {
  if (
    !Array.isArray(reasons) ||
    reasons.length === 0
  ) {
    return "";
  }

  return `
    <ul class="native-plant-reasons">

      ${reasons
        .map(function(reason) {
          return `
            <li>
              ${escapeSidebarHTML(
                reason
              )}
            </li>
          `;
        })
        .join("")}

    </ul>
  `;
}


// ------------------------------------------------------------
// 18. PLANT CAUTION LIST
// ------------------------------------------------------------

function createNativePlantCautionList(
  cautions
) {
  if (
    !Array.isArray(cautions) ||
    cautions.length === 0
  ) {
    return "";
  }

  return `
    <ul class="native-plant-cautions">

      ${cautions
        .map(function(caution) {
          return `
            <li>
              ${escapeSidebarHTML(
                caution
              )}
            </li>
          `;
        })
        .join("")}

    </ul>
  `;
}


// ------------------------------------------------------------
// 19. RESTORATION-USE TAGS
// ------------------------------------------------------------

function createPlantRestorationUses(
  uses
) {
  if (
    !Array.isArray(uses) ||
    uses.length === 0
  ) {
    return "";
  }

  return `
    <div class="plant-use-tags">

      ${uses
        .map(function(use) {
          return `
            <span class="plant-use-tag">
              ${escapeSidebarHTML(
                use
              )}
            </span>
          `;
        })
        .join("")}

    </div>
  `;
}


// ------------------------------------------------------------
// 20. DETAILED NATIVE-PLANT CARD
// ------------------------------------------------------------

function createNativePlantCard(
  recommendation,
  rank
) {
  if (
    !recommendation ||
    typeof recommendation !== "object"
  ) {
    return "";
  }

  const commonName =
    recommendation.commonName ||
    "Unnamed native plant";

  const scientificName =
    recommendation.scientificName ||
    "Scientific name unavailable";

  const plantType =
    recommendation.plantType ||
    "Native plant";

  const matchPercentage =
    Number.isFinite(
      Number(
        recommendation.matchPercentage
      )
    )
      ? Number(
          recommendation.matchPercentage
        )
      : 0;

  const matchClass =
    getNativePlantMatchClass(
      matchPercentage
    );

  const matchLabel =
    getNativePlantMatchLabel(
      matchPercentage
    );

  const reasons =
    Array.isArray(
      recommendation.reasons
    )
      ? recommendation.reasons.slice(
          0,
          6
        )
      : [];

  const cautions =
    Array.isArray(
      recommendation.cautions
    )
      ? recommendation.cautions.slice(
          0,
          6
        )
      : [];

  const ratings =
    recommendation.ratings &&
    typeof recommendation.ratings ===
      "object"
      ? recommendation.ratings
      : {};

  const componentScores =
    recommendation.componentScores &&
    typeof recommendation.componentScores ===
      "object"
      ? recommendation.componentScores
      : {};

  const siteConditions =
    recommendation.siteConditions &&
    typeof recommendation.siteConditions ===
      "object"
      ? recommendation.siteConditions
      : {};

  const sourceLink =
    recommendation.source &&
    recommendation.source.profileSearch
      ? recommendation.source.profileSearch
      : "";

  const elevationRange =
    createPlantRangeText(
      recommendation.minElevationFeet,
      recommendation.maxElevationFeet,
      "ft"
    );

  const rainfallRange =
    createPlantRangeText(
      recommendation.minRainfallMm,
      recommendation.maxRainfallMm,
      "mm/year"
    );

  const siteElevation =
    Number.isFinite(
      Number(
        siteConditions.elevationFeet
      )
    )
      ? `${sidebarFormatNumber(
          siteConditions.elevationFeet
        )} ft`
      : "Not available";

  const siteRainfall =
    Number.isFinite(
      Number(
        siteConditions.rainfallMm
      )
    )
      ? `${sidebarFormatNumber(
          siteConditions.rainfallMm
        )} mm/year`
      : "Not available";

  const siteSlope =
    Number.isFinite(
      Number(
        siteConditions.slopeDegrees
      )
    )
      ? `${sidebarFormatNumber(
          siteConditions.slopeDegrees,
          1
        )}°`
      : "Not available";

  const siteAspect =
    siteConditions.aspect ||
    "Not available";

  const preferredAspects =
    Array.isArray(
      recommendation.preferredAspects
    ) &&
    recommendation.preferredAspects.length >
      0
      ? recommendation.preferredAspects.join(
          ", "
        )
      : "Flexible";

  const maximumSlope =
    Number.isFinite(
      Number(
        recommendation.maximumSlopeDegrees
      )
    )
      ? `${sidebarFormatNumber(
          recommendation.maximumSlopeDegrees
        )}°`
      : "Not available";

  return `
    <article class="native-plant-card">

      <div class="native-plant-card-header">

        <div class="native-plant-rank">
          ${escapeSidebarHTML(rank)}
        </div>

        <div class="native-plant-heading">

          <h4>
            ${escapeSidebarHTML(
              commonName
            )}
          </h4>

          <p class="native-plant-scientific-name">
            <em>
              ${escapeSidebarHTML(
                scientificName
              )}
            </em>
          </p>

        </div>

        <div class="native-plant-match ${matchClass}">
          ${escapeSidebarHTML(
            matchPercentage
          )}%
        </div>

      </div>


      <div class="native-plant-match-summary">

        <span class="native-plant-type">
          ${escapeSidebarHTML(
            plantType
          )}
        </span>

        <strong class="${matchClass}">
          ${escapeSidebarHTML(
            matchLabel
          )}
        </strong>

      </div>


      <div class="native-plant-progress-track">

        <div
          class="native-plant-progress-fill ${matchClass}"
          style="width: ${Math.min(
            Math.max(
              matchPercentage,
              0
            ),
            100
          )}%"
        ></div>

      </div>


      <section class="plant-card-section">

        <h5>
          Why it matches this fire
        </h5>

        ${createNativePlantReasonList(
          reasons
        )}

      </section>


      <details class="native-plant-details">

        <summary>
          Match score details
        </summary>

        <div class="native-plant-details-content">

          ${createPlantComponentScore(
            "Elevation",
            componentScores.elevation
          )}

          ${createPlantComponentScore(
            "Rainfall",
            componentScores.rainfall
          )}

          ${createPlantComponentScore(
            "Slope",
            componentScores.slope
          )}

          ${createPlantComponentScore(
            "Aspect",
            componentScores.aspect
          )}

          ${createPlantComponentScore(
            "Restoration value",
            componentScores.restorationValue
          )}

        </div>

      </details>


      <details class="native-plant-details">

        <summary>
          Site comparison
        </summary>

        <div class="native-plant-details-content">

          <div class="plant-comparison-grid">

            <div class="plant-comparison-card">

              <h6>
                Selected fire
              </h6>

              ${createPlantEcologicalRow(
                "Elevation",
                siteElevation
              )}

              ${createPlantEcologicalRow(
                "Rainfall",
                siteRainfall
              )}

              ${createPlantEcologicalRow(
                "Slope",
                siteSlope
              )}

              ${createPlantEcologicalRow(
                "Aspect",
                siteAspect
              )}

            </div>


            <div class="plant-comparison-card">

              <h6>
                Plant screening range
              </h6>

              ${createPlantEcologicalRow(
                "Elevation",
                elevationRange
              )}

              ${createPlantEcologicalRow(
                "Rainfall",
                rainfallRange
              )}

              ${createPlantEcologicalRow(
                "Maximum slope",
                maximumSlope
              )}

              ${createPlantEcologicalRow(
                "Preferred aspects",
                preferredAspects
              )}

            </div>

          </div>

        </div>

      </details>


      <details class="native-plant-details">

        <summary>
          Ecological requirements
        </summary>

        <div class="native-plant-details-content">

          <div class="plant-ecological-grid">

            ${createPlantEcologicalRow(
              "Sun exposure",
              recommendation.sunExposure
            )}

            ${createPlantEcologicalRow(
              "Water need",
              recommendation.waterNeed
            )}

            ${createPlantEcologicalRow(
              "Drought tolerance",
              recommendation.droughtTolerance
            )}

            ${createPlantEcologicalRow(
              "Soil and drainage",
              recommendation.soilAndDrainage
            )}

            ${createPlantEcologicalRow(
              "Habitat",
              recommendation.habitat
            )}

            ${createPlantEcologicalRow(
              "Bloom season",
              recommendation.bloomSeason
            )}

            ${createPlantEcologicalRow(
              "Fire response",
              recommendation.fireResponse
            )}

          </div>

        </div>

      </details>


      <details class="native-plant-details">

        <summary>
          Ecological and restoration value
        </summary>

        <div class="native-plant-details-content">

          <div class="plant-rating-grid">

            ${createPlantEcologicalRow(
              "Erosion control",
              createPlantRatingText(
                ratings.erosionControl
              )
            )}

            ${createPlantEcologicalRow(
              "Fire recovery",
              createPlantRatingText(
                ratings.fireRecovery
              )
            )}

            ${createPlantEcologicalRow(
              "Wildlife value",
              createPlantRatingText(
                ratings.wildlifeValue
              )
            )}

            ${createPlantEcologicalRow(
              "Pollinator value",
              createPlantRatingText(
                ratings.pollinatorValue
              )
            )}

          </div>

          ${
            Array.isArray(
              recommendation.restorationUses
            ) &&
            recommendation.restorationUses.length >
              0
              ? `
                <h6 class="plant-subheading">
                  Potential restoration uses
                </h6>

                ${createPlantRestorationUses(
                  recommendation.restorationUses
                )}
              `
              : ""
          }

        </div>

      </details>


      ${
        recommendation.restorationNotes
          ? `
            <details class="native-plant-details">

              <summary>
                Restoration notes
              </summary>

              <div class="native-plant-details-content">

                <p class="native-plant-note-text">
                  ${escapeSidebarHTML(
                    recommendation.restorationNotes
                  )}
                </p>

              </div>

            </details>
          `
          : ""
      }


      <details class="native-plant-details native-plant-caution-details">

        <summary>
          Verify before use
        </summary>

        <div class="native-plant-details-content">

          ${createNativePlantCautionList(
            cautions
          )}

        </div>

      </details>


      ${
        sourceLink
          ? `
            <a
              class="native-plant-source-link"
              href="${escapeSidebarHTML(
                sourceLink
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              View CNPS/Calscape information
              <span aria-hidden="true">
                ↗
              </span>
            </a>
          `
          : ""
      }

    </article>
  `;
}


// ------------------------------------------------------------
// 21. NATIVE-PLANT RECOMMENDATION CONTENT
// ------------------------------------------------------------

function createNativePlantRecommendationsContent(
  fireProperties
) {
  if (
    typeof getNativePlantRecommendations !==
    "function"
  ) {
    return `
      <div class="future-feature-message">

        The native-plant matching function was not found.

        Confirm that
        <strong>plant.js</strong>
        loads before
        <strong>sidebar.js</strong>
        in index.html.

      </div>
    `;
  }

  let recommendations = [];

  try {
    recommendations =
      getNativePlantRecommendations(
        fireProperties,
        5
      );
  } catch (error) {
    console.error(
      "Native-plant recommendation error:",
      error
    );

    return `
      <div class="future-feature-message">

        Native-plant recommendations could
        not be calculated for this fire.

        Open the browser console for details.

      </div>
    `;
  }

  if (
    !Array.isArray(recommendations) ||
    recommendations.length === 0
  ) {
    return `
      <div class="future-feature-message">

        No candidate species met the current
        environmental-match threshold.

        More information about soils, hydrology,
        burn severity, and vegetation type may
        be required.

      </div>
    `;
  }

  const recommendationCards =
    recommendations
      .map(function(
        recommendation,
        index
      ) {
        return createNativePlantCard(
          recommendation,
          index + 1
        );
      })
      .join("");

  return `
    <div class="native-plant-screening-notice">

      <h4>
        Preliminary restoration screening
      </h4>

      <p>
        These are
        <strong>
          candidate native species for further evaluation
        </strong>,
        not automatic planting instructions.
      </p>

      <p>
        Rankings compare elevation, rainfall,
        slope, aspect, and broad restoration
        values. Expand each card to inspect the
        match, ecological requirements, cautions,
        and CNPS/Calscape source.
      </p>

    </div>


    <div class="native-plant-list">
      ${recommendationCards}
    </div>


    <div class="native-plant-verification">

      <h4>
        Site verification is required
      </h4>

      <ul>

        <li>
          Confirm that each species naturally
          occurs in the local plant community.
        </li>

        <li>
          Survey natural native regeneration
          before planting or seeding.
        </li>

        <li>
          Check soil, drainage, streams, seeps,
          wetlands, and meadow conditions.
        </li>

        <li>
          Review burn severity and the pre-fire
          vegetation community.
        </li>

        <li>
          Use locally sourced seed or plant
          material whenever possible.
        </li>

        <li>
          Review the final plan with restoration
          professionals or land managers.
        </li>

      </ul>

    </div>
  `;
}


// ------------------------------------------------------------
// 22. ACCORDION SECTION
// ------------------------------------------------------------

function createAccordionSection({
  id,
  title,
  icon = "",
  content,
  open = false,
  badge = ""
}) {
  return `
    <section
      class="accordion-section ${
        open ? "is-open" : ""
      }"
      data-accordion-section
    >

      <button
        type="button"
        class="accordion-button"
        data-accordion-button
        aria-expanded="${
          open ? "true" : "false"
        }"
        aria-controls="${escapeSidebarHTML(
          id
        )}"
      >

        <span class="accordion-title-group">

          ${
            icon
              ? `
                <span
                  class="accordion-icon"
                  aria-hidden="true"
                >
                  ${icon}
                </span>
              `
              : ""
          }

          <span class="accordion-title">
            ${escapeSidebarHTML(title)}
          </span>

        </span>

        <span class="accordion-button-right">

          ${
            badge
              ? `
                <span class="accordion-badge">
                  ${escapeSidebarHTML(
                    badge
                  )}
                </span>
              `
              : ""
          }

          <span
            class="accordion-chevron"
            aria-hidden="true"
          >
            ▾
          </span>

        </span>

      </button>

      <div
        id="${escapeSidebarHTML(id)}"
        class="accordion-panel"
        ${
          open
            ? ""
            : "hidden"
        }
      >

        <div class="accordion-panel-inner">
          ${content}
        </div>

      </div>

    </section>
  `;
}


// ------------------------------------------------------------
// 23. DATA-SOURCE CONTENT
// ------------------------------------------------------------

function createSidebarDataStatusContent() {
  return `
    <div class="sidebar-detail-grid">

      ${createSidebarDetailRow(
        "Fire Age",
        "Calculated"
      )}

      ${createSidebarDetailRow(
        "Elevation",
        "Real GIS Data"
      )}

      ${createSidebarDetailRow(
        "Slope",
        "Real GIS Data"
      )}

      ${createSidebarDetailRow(
        "Aspect",
        "Real GIS Data"
      )}

      ${createSidebarDetailRow(
        "Road Distance",
        "Real GIS Data"
      )}

      ${createSidebarDetailRow(
        "Annual Rainfall",
        "Real GIS Data"
      )}

      ${createSidebarDetailRow(
        "Invasive Proximity",
        "Real GBIF Data"
      )}

      ${createSidebarDetailRow(
        "Native Species Library",
        "CNPS/Calscape-informed"
      )}

      ${createSidebarDetailRow(
        "Plant Match Score",
        "Calculated screening model"
      )}

    </div>

    <p class="data-status-description">

      Native-species scores are generated by
      the app's transparent suitability model.

      They use broad elevation, rainfall, slope,
      aspect, and ecological-value criteria.

      They are not official CNPS planting
      prescriptions.

    </p>
  `;
}


// ------------------------------------------------------------
// 24. ACCORDION INTERACTION
// ------------------------------------------------------------

function initializeSidebarAccordion() {
  const sidebar =
    document.getElementById(
      "sidebar"
    );

  if (!sidebar) {
    return;
  }

  sidebar
    .querySelectorAll(
      "[data-accordion-button]"
    )
    .forEach(function(button) {
      button.addEventListener(
        "click",
        function() {
          const selectedSection =
            button.closest(
              "[data-accordion-section]"
            );

          if (!selectedSection) {
            return;
          }

          const isOpen =
            selectedSection.classList.contains(
              "is-open"
            );

          sidebar
            .querySelectorAll(
              "[data-accordion-section]"
            )
            .forEach(function(section) {
              section.classList.remove(
                "is-open"
              );

              const sectionButton =
                section.querySelector(
                  "[data-accordion-button]"
                );

              const sectionPanel =
                section.querySelector(
                  ".accordion-panel"
                );

              if (sectionButton) {
                sectionButton.setAttribute(
                  "aria-expanded",
                  "false"
                );
              }

              if (sectionPanel) {
                sectionPanel.hidden = true;
              }
            });

          if (!isOpen) {
            selectedSection.classList.add(
              "is-open"
            );

            button.setAttribute(
              "aria-expanded",
              "true"
            );

            const selectedPanel =
              selectedSection.querySelector(
                ".accordion-panel"
              );

            if (selectedPanel) {
              selectedPanel.hidden = false;
            }
          }
        }
      );
    });
}


// ------------------------------------------------------------
// 25. UPDATE SIDEBAR
// ------------------------------------------------------------

function updateSidebar(
  properties,
  riskResult
) {
  const sidebar =
    document.getElementById(
      "sidebar"
    );

  if (!sidebar) {
    console.error(
      'Sidebar element with id="sidebar" was not found.'
    );

    return;
  }

  const safeProperties =
    properties &&
    typeof properties === "object"
      ? properties
      : {};

  const safeRisk =
    riskResult &&
    typeof riskResult === "object"
      ? riskResult
      : {
          score: 0,
          maximumScore: 70,
          percentage: 0,
          level: "Unknown",
          breakdown: {}
        };

  const breakdown =
    safeRisk.breakdown &&
    typeof safeRisk.breakdown ===
      "object"
      ? safeRisk.breakdown
      : {};


  // Fire information

  const fireName =
    sidebarFireName(
      safeProperties
    );

  const fireYear =
    sidebarFireYear(
      safeProperties
    );

  const agency =
    sidebarAgency(
      safeProperties
    );

  const unit =
    sidebarUnit(
      safeProperties
    );

  const incidentNumber =
    sidebarIncidentNumber(
      safeProperties
    );

  const alarmDate =
    sidebarAlarmDate(
      safeProperties
    );

  const fireSize =
    sidebarFireSize(
      safeProperties
    );


  // Environmental information

  const elevation =
    Number(
      safeProperties.elev_mean
    );

  const elevationFeet =
    sidebarMetersToFeet(
      elevation
    );

  const slope =
    Number(
      safeProperties.slope_mean
    );

  const aspect =
    Number(
      safeProperties.aspect_mean
    );

  const roadDistance =
    Number(
      safeProperties.road_dist_mean
    );

  const roadMiles =
    sidebarMetersToMiles(
      roadDistance
    );

  const rainfall =
    Number(
      safeProperties.rainfall_mean
    );

  const rainfallInches =
    sidebarMillimetersToInches(
      rainfall
    );

  const invasiveDistance =
    Number(
      safeProperties.invasive_dist_mean
    );

  const invasiveMiles =
    sidebarMetersToMiles(
      invasiveDistance
    );


  // Risk summary

  const displayedScore =
    Number.isFinite(
      Number(safeRisk.score)
    )
      ? Number(safeRisk.score)
      : 0;

  const displayedMaximum =
    Number.isFinite(
      Number(
        safeRisk.maximumScore
      )
    )
      ? Number(
          safeRisk.maximumScore
        )
      : 70;

  const calculatedPercentage =
    displayedMaximum > 0
      ? Math.round(
          (
            displayedScore /
            displayedMaximum
          ) * 100
        )
      : 0;

  const displayedPercentage =
    Number.isFinite(
      Number(
        safeRisk.percentage
      )
    )
      ? Number(
          safeRisk.percentage
        )
      : calculatedPercentage;

  const riskLevel =
    safeRisk.level ||
    "Unknown";

  const riskClass =
    getSidebarRiskClass(
      riskLevel
    );


  // Fire-information content

  const fireInformationContent = `
    <div class="sidebar-detail-grid">

      ${createSidebarDetailRow(
        "Year",
        fireYear
      )}

      ${createSidebarDetailRow(
        "Agency",
        agency
      )}

      ${createSidebarDetailRow(
        "Unit",
        unit
      )}

      ${createSidebarDetailRow(
        "Incident Number",
        incidentNumber
      )}

      ${createSidebarDetailRow(
        "Alarm Date",
        alarmDate
      )}

      ${createSidebarDetailRow(
        "Fire Size",
        fireSize
      )}

    </div>
  `;


  // Environmental content

  const environmentalContent = `
    <div class="environment-list">

      ${createEnvironmentalRow(
        "Mean Elevation",
        Number.isFinite(elevation)
          ? `${sidebarFormatNumber(
              elevation
            )} m`
          : "Not available",
        elevationFeet !== null
          ? `${sidebarFormatNumber(
              elevationFeet
            )} ft`
          : ""
      )}

      ${createEnvironmentalRow(
        "Mean Slope",
        Number.isFinite(slope)
          ? `${sidebarFormatNumber(
              slope,
              1
            )}°`
          : "Not available"
      )}

      ${createEnvironmentalRow(
        "Mean Aspect",
        Number.isFinite(aspect)
          ? sidebarAspectDirection(
              aspect
            )
          : "Not available",
        Number.isFinite(aspect)
          ? `${sidebarFormatNumber(
              aspect,
              1
            )}°`
          : ""
      )}

      ${createEnvironmentalRow(
        "Mean Distance to Roads",
        Number.isFinite(
          roadDistance
        )
          ? `${sidebarFormatNumber(
              roadDistance
            )} m`
          : "Not available",
        roadMiles !== null
          ? `${sidebarFormatNumber(
              roadMiles,
              2
            )} mi`
          : ""
      )}

      ${createEnvironmentalRow(
        "Mean Annual Rainfall",
        Number.isFinite(rainfall)
          ? `${sidebarFormatNumber(
              rainfall
            )} mm/year`
          : "Not available",
        rainfallInches !== null
          ? `${sidebarFormatNumber(
              rainfallInches,
              1
            )} in/year`
          : ""
      )}

    </div>
  `;


  // Invasive content

  const invasiveContent = `
    <div class="invasive-summary-card">

      <p class="invasive-summary-label">
        Mean Distance to Nearest Documented
        Invasive Observation
      </p>

      <div class="invasive-summary-value">
        ${
          Number.isFinite(
            invasiveDistance
          )
            ? `${sidebarFormatNumber(
                invasiveDistance
              )} m`
            : "Not available"
        }
      </div>

      ${
        invasiveMiles !== null
          ? `
            <div class="secondary-value">
              ${sidebarFormatNumber(
                invasiveMiles,
                2
              )} miles
            </div>
          `
          : ""
      }

      <p class="invasive-summary-description">

        This value is calculated from the
        combined GBIF occurrence dataset for
        the selected target invasive species.

      </p>

    </div>

    ${
      breakdown.invasiveDistance
        ? createRiskFactorCard(
            breakdown.invasiveDistance
          )
        : ""
    }
  `;


  // Risk summary content

  const riskSummaryContent = `
    <div class="risk-summary-card ${riskClass}">

      <div class="risk-score-row">

        <div>

          <span class="risk-score">
            ${escapeSidebarHTML(
              displayedScore
            )}
          </span>

          <span class="risk-score-maximum">
            /${escapeSidebarHTML(
              displayedMaximum
            )}
          </span>

        </div>

        <span class="risk-level-badge">
          ${escapeSidebarHTML(
            riskLevel
          )}
        </span>

      </div>

      <div class="risk-progress-track">

        <div
          class="risk-progress-fill"
          style="width: ${Math.min(
            Math.max(
              displayedPercentage,
              0
            ),
            100
          )}%"
        ></div>

      </div>

      <p class="risk-percentage">

        ${escapeSidebarHTML(
          displayedPercentage
        )}% of maximum risk

      </p>

    </div>
  `;


  // Risk-factor content

  const riskFactorContent = `
    <div class="risk-factor-list">

      ${createRiskFactorCard(
        breakdown.fireAge
      )}

      ${createRiskFactorCard(
        breakdown.elevation
      )}

      ${createRiskFactorCard(
        breakdown.slope
      )}

      ${createRiskFactorCard(
        breakdown.aspect
      )}

      ${createRiskFactorCard(
        breakdown.roadDistance
      )}

      ${createRiskFactorCard(
        breakdown.rainfall
      )}

      ${createRiskFactorCard(
        breakdown.invasiveDistance
      )}

    </div>
  `;


  // Native-plant recommendations

  const nativePlantContent =
    createNativePlantRecommendationsContent(
      safeProperties
    );


  // Build sidebar

  sidebar.innerHTML = `
    <div class="sidebar-content accordion-sidebar">

      <header class="selected-fire-header">

        <p class="sidebar-eyebrow">
          Selected Fire
        </p>

        <h2>
          ${escapeSidebarHTML(
            fireName
          )}
        </h2>

        <div class="selected-fire-summary">

          <span>
            ${escapeSidebarHTML(
              fireYear
            )}
          </span>

          <span class="summary-divider">
            •
          </span>

          <span class="${riskClass}">
            ${escapeSidebarHTML(
              riskLevel
            )} Risk
          </span>

        </div>

      </header>


      <div class="accordion-list">

        ${createAccordionSection({
          id:
            "fire-information-panel",

          title:
            "Fire Information",

          icon:
            "🔥",

          content:
            fireInformationContent,

          open:
            true
        })}


        ${createAccordionSection({
          id:
            "environment-panel",

          title:
            "Environmental Conditions",

          icon:
            "⛰️",

          content:
            environmentalContent
        })}


        ${createAccordionSection({
          id:
            "risk-summary-panel",

          title:
            "Invasion Risk Summary",

          icon:
            "📊",

          content:
            riskSummaryContent,

          badge:
            `${displayedScore}/${displayedMaximum}`
        })}


        ${createAccordionSection({
          id:
            "risk-factors-panel",

          title:
            "Risk Factor Details",

          icon:
            "🧮",

          content:
            riskFactorContent,

          badge:
            "7 factors"
        })}


        ${createAccordionSection({
          id:
            "invasive-panel",

          title:
            "Nearby Invasive Plants",

          icon:
            "🌱",

          content:
            invasiveContent
        })}


        ${createAccordionSection({
          id:
            "native-plants-panel",

          title:
            "Candidate Native Species",

          icon:
            "🌿",

          content:
            nativePlantContent,

          badge:
            "Top 5"
        })}


        ${createAccordionSection({
          id:
            "data-sources-panel",

          title:
            "Data Sources",

          icon:
            "🗂️",

          content:
            createSidebarDataStatusContent()
        })}

      </div>

    </div>
  `;

  initializeSidebarAccordion();

  sidebar.scrollTop = 0;
}


// ------------------------------------------------------------
// 26. WELCOME MESSAGE
// ------------------------------------------------------------

function showSidebarWelcomeMessage() {
  const sidebar =
    document.getElementById(
      "sidebar"
    );

  if (!sidebar) {
    return;
  }

  sidebar.innerHTML = `
    <div class="sidebar-content">

      <section class="sidebar-section welcome-section">

        <p class="sidebar-eyebrow">
          Invasion After Fire
        </p>

        <h2>
          Select a Fire
        </h2>

        <p>

          Click a fire polygon to view its
          environmental conditions, invasive-plant
          proximity, invasion-risk score, and
          detailed candidate native-species
          recommendations.

        </p>

        <div class="welcome-feature-list">

          <div>
            <span aria-hidden="true">
              🔥
            </span>

            Fire information
          </div>

          <div>
            <span aria-hidden="true">
              ⛰️
            </span>

            Environmental GIS data
          </div>

          <div>
            <span aria-hidden="true">
              📊
            </span>

            Invasion-risk assessment
          </div>

          <div>
            <span aria-hidden="true">
              🌱
            </span>

            Nearby invasive observations
          </div>

          <div>
            <span aria-hidden="true">
              🌿
            </span>

            Candidate native species
          </div>

        </div>

      </section>

    </div>
  `;
}


// ------------------------------------------------------------
// 27. INITIAL DISPLAY
// ------------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  showSidebarWelcomeMessage
);


// ------------------------------------------------------------
// 28. EXPOSE UPDATE FUNCTION
// ------------------------------------------------------------

window.updateSidebar =
  updateSidebar;

window.showSidebarWelcomeMessage =
  showSidebarWelcomeMessage;