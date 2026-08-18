// ============================================================
// INVASION AFTER FIRE
// risk.js
//
// Risk model using:
//
// CALCULATED:
// - Fire age
//
// REAL GIS DATA:
// - Elevation
// - Slope
// - Aspect
// - Distance to roads
// - Annual rainfall
// - Distance to nearest invasive-plant observation
//
// Maximum score: 70 points
// ============================================================


const MAXIMUM_RISK_SCORE = 70;


// ------------------------------------------------------------
// 1. GENERAL HELPERS
// ------------------------------------------------------------

function toValidNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}


// ------------------------------------------------------------
// 2. FIRE YEAR
// ------------------------------------------------------------

function getRiskFireYear(properties) {
  const possibleFields = [
    "YEAR_",
    "YEAR",
    "FIRE_YEAR"
  ];

  for (const field of possibleFields) {
    const year =
      Number(properties[field]);

    if (
      Number.isInteger(year) &&
      year > 1800 &&
      year <= new Date().getFullYear()
    ) {
      return year;
    }
  }

  return null;
}


// ------------------------------------------------------------
// 3. FIRE-AGE RISK
// ------------------------------------------------------------
// Recently burned areas receive more points because
// disturbance and exposed soil can increase invasion risk.
//
// Maximum: 10 points

function scoreFireAge(properties) {
  const fireYear =
    getRiskFireYear(properties);

  if (fireYear === null) {
    return {
      label: "Fire Age",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Calculated",
      explanation:
        "The fire year was not available."
    };
  }

  const currentYear =
    new Date().getFullYear();

  const fireAge =
    Math.max(
      0,
      currentYear - fireYear
    );

  let points;
  let explanation;

  if (fireAge <= 2) {
    points = 10;
    explanation =
      "Very recent burns have exposed soil and limited established vegetation.";
  } else if (fireAge <= 5) {
    points = 8;
    explanation =
      "Recent burns remain highly vulnerable to invasive-plant establishment.";
  } else if (fireAge <= 10) {
    points = 6;
    explanation =
      "The site is still within an important post-fire recovery period.";
  } else if (fireAge <= 20) {
    points = 4;
    explanation =
      "Vegetation recovery may reduce some opportunities for new invasion.";
  } else {
    points = 1;
    explanation =
      "Older burns generally have more established vegetation and lower disturbance-related risk.";
  }

  return {
    label: "Fire Age",
    points: points,
    maximumPoints: 10,
    value: fireAge,
    displayValue:
      `${fireAge} years`,
    source: "Calculated",
    explanation: explanation
  };
}


// ------------------------------------------------------------
// 4. ELEVATION RISK
// ------------------------------------------------------------
// Lower and middle elevations generally support more
// invasive species and receive more human disturbance.
//
// Maximum: 10 points

function scoreElevation(properties) {
  const elevation =
    toValidNumber(
      properties.elev_mean
    );

  if (elevation === null) {
    return {
      label: "Elevation",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Real GIS Data",
      explanation:
        "Elevation data was not available."
    };
  }

  let points;
  let explanation;

  if (elevation < 500) {
    points = 10;
    explanation =
      "Low-elevation areas are warm, accessible, and suitable for many invasive species.";
  } else if (elevation < 1000) {
    points = 8;
    explanation =
      "Foothill elevations can support many invasive plant species.";
  } else if (elevation < 1500) {
    points = 6;
    explanation =
      "Mid-elevation conditions create moderate invasive-plant risk.";
  } else if (elevation < 2000) {
    points = 4;
    explanation =
      "Higher elevations limit some invasive species.";
  } else {
    points = 2;
    explanation =
      "Cold, high-elevation conditions reduce suitability for many invasive plants.";
  }

  return {
    label: "Elevation",
    points: points,
    maximumPoints: 10,
    value: elevation,
    displayValue:
      `${Math.round(
        elevation
      ).toLocaleString()} m`,
    source: "Real GIS Data",
    explanation: explanation
  };
}


// ------------------------------------------------------------
// 5. SLOPE RISK
// ------------------------------------------------------------
// Gentle and moderate slopes tend to be more accessible
// and easier for invasive plants to establish on.
//
// Maximum: 10 points

function scoreSlope(properties) {
  const slope =
    toValidNumber(
      properties.slope_mean
    );

  if (slope === null) {
    return {
      label: "Slope",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Real GIS Data",
      explanation:
        "Slope data was not available."
    };
  }

  let points;
  let explanation;

  if (slope < 5) {
    points = 7;
    explanation =
      "Flat terrain is accessible and often exposed to disturbance.";
  } else if (slope < 15) {
    points = 10;
    explanation =
      "Gentle to moderate slopes provide highly favorable conditions for invasive establishment.";
  } else if (slope < 30) {
    points = 7;
    explanation =
      "Moderately steep terrain still presents meaningful invasion risk.";
  } else if (slope < 45) {
    points = 4;
    explanation =
      "Steep terrain can reduce accessibility and plant establishment.";
  } else {
    points = 2;
    explanation =
      "Very steep terrain generally limits access and invasive spread.";
  }

  return {
    label: "Slope",
    points: points,
    maximumPoints: 10,
    value: slope,
    displayValue:
      `${slope.toFixed(1)}°`,
    source: "Real GIS Data",
    explanation: explanation
  };
}


// ------------------------------------------------------------
// 6. ASPECT HELPERS
// ------------------------------------------------------------

function normalizeAspect(aspect) {
  return (
    (aspect % 360) + 360
  ) % 360;
}


function getRiskAspectDirection(aspect) {
  const numericAspect =
    toValidNumber(aspect);

  if (numericAspect === null) {
    return "Not available";
  }

  const normalized =
    normalizeAspect(
      numericAspect
    );

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
// 7. ASPECT RISK
// ------------------------------------------------------------
// South- and southwest-facing slopes tend to be warmer
// and drier in the Northern Hemisphere.
//
// Maximum: 10 points

function scoreAspect(properties) {
  const aspect =
    toValidNumber(
      properties.aspect_mean
    );

  if (aspect === null) {
    return {
      label: "Aspect",
      points: 0,
      maximumPoints: 10,
      value: null,
      numericValue: null,
      displayValue: "Not available",
      source: "Real GIS Data",
      explanation:
        "Aspect data was not available."
    };
  }

  const normalized =
    normalizeAspect(aspect);

  const direction =
    getRiskAspectDirection(
      normalized
    );

  let points;
  let explanation;

  if (
    normalized >= 157.5 &&
    normalized < 247.5
  ) {
    points = 10;
    explanation =
      "South- and southwest-facing slopes receive more sunlight and often experience warmer, drier conditions.";
  } else if (
    (
      normalized >= 112.5 &&
      normalized < 157.5
    ) ||
    (
      normalized >= 247.5 &&
      normalized < 292.5
    )
  ) {
    points = 8;
    explanation =
      "This exposure receives substantial sunlight and has elevated invasion risk.";
  } else if (
    (
      normalized >= 67.5 &&
      normalized < 112.5
    ) ||
    (
      normalized >= 292.5 &&
      normalized < 337.5
    )
  ) {
    points = 6;
    explanation =
      "This exposure has intermediate sunlight and moisture conditions.";
  } else {
    points = 4;
    explanation =
      "North- and northeast-facing slopes are generally cooler and moister.";
  }

  return {
    label: "Aspect",
    points: points,
    maximumPoints: 10,
    value: direction,
    numericValue: normalized,
    displayValue:
      `${direction} (${normalized.toFixed(
        1
      )}°)`,
    source: "Real GIS Data",
    explanation: explanation
  };
}


// ------------------------------------------------------------
// 8. ROAD-DISTANCE RISK
// ------------------------------------------------------------
// Roads can transport invasive seeds through vehicles,
// equipment, people, and soil disturbance.
//
// Maximum: 10 points

function scoreRoadDistance(properties) {
  const distance =
    toValidNumber(
      properties.road_dist_mean
    );

  if (distance === null) {
    return {
      label: "Road Distance",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Real GIS Data",
      explanation:
        "Road-distance data was not available."
    };
  }

  let points;
  let explanation;

  if (distance <= 100) {
    points = 10;
    explanation =
      "The fire is extremely close to roads, creating high exposure to seed transport and disturbance.";
  } else if (distance <= 500) {
    points = 8;
    explanation =
      "The fire is close to roads and has elevated exposure to human-assisted seed dispersal.";
  } else if (distance <= 1000) {
    points = 6;
    explanation =
      "The fire has moderate exposure to road-related disturbance.";
  } else if (distance <= 3000) {
    points = 4;
    explanation =
      "The fire is relatively far from roads, reducing direct exposure.";
  } else {
    points = 2;
    explanation =
      "The fire is far from roads, so road-related seed dispersal is less likely.";
  }

  return {
    label: "Road Distance",
    points: points,
    maximumPoints: 10,
    value: distance,
    displayValue:
      `${Math.round(
        distance
      ).toLocaleString()} m`,
    source: "Real GIS Data",
    explanation: explanation
  };
}


// ------------------------------------------------------------
// 9. RAINFALL RISK
// ------------------------------------------------------------
// Uses long-term annual precipitation from PRISM.
//
// Maximum: 10 points

function scoreRainfall(properties) {
  const rainfall =
    toValidNumber(
      properties.rainfall_mean
    );

  if (rainfall === null) {
    return {
      label: "Rainfall",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Real GIS Data",
      explanation:
        "Rainfall data was not available."
    };
  }

  let points;
  let explanation;

  if (rainfall < 400) {
    points = 4;
    explanation =
      "Very dry conditions can limit establishment for many plant species.";
  } else if (rainfall < 700) {
    points = 7;
    explanation =
      "Moderately dry conditions support some drought-tolerant invasive species.";
  } else if (rainfall < 1200) {
    points = 10;
    explanation =
      "This rainfall range provides highly favorable moisture for post-fire invasive plant growth.";
  } else if (rainfall < 1800) {
    points = 8;
    explanation =
      "High rainfall supports rapid vegetation growth, including invasive species.";
  } else {
    points = 5;
    explanation =
      "Very wet conditions support vegetation growth but may also favor strong native recovery.";
  }

  const rainfallInches =
    rainfall / 25.4;

  return {
    label: "Rainfall",
    points: points,
    maximumPoints: 10,
    value: rainfall,
    displayValue:
      `${Math.round(
        rainfall
      ).toLocaleString()} mm/year`,
    source: "Real GIS Data",
    explanation:
      `${explanation} This equals approximately ${rainfallInches.toFixed(
        1
      )} inches per year.`
  };
}


// ------------------------------------------------------------
// 10. INVASIVE-OCCURRENCE DISTANCE RISK
// ------------------------------------------------------------
// Uses the combined GBIF occurrence dataset for multiple
// invasive species.
//
// Smaller distance = higher risk.
//
// Maximum: 10 points

function scoreInvasiveDistance(properties) {
  const distance =
    toValidNumber(
      properties.invasive_dist_mean
    );

  if (distance === null) {
    return {
      label:
        "Nearest Invasive Observation",
      points: 0,
      maximumPoints: 10,
      value: null,
      displayValue: "Not available",
      source: "Real GBIF Data",
      explanation:
        "No invasive-plant distance value was available for this fire."
    };
  }

  let points;
  let explanation;

  if (distance <= 250) {
    points = 10;
    explanation =
      "A documented invasive-plant observation is extremely close to the burned area.";
  } else if (distance <= 500) {
    points = 8;
    explanation =
      "A documented invasive-plant observation is close to the fire.";
  } else if (distance <= 1000) {
    points = 6;
    explanation =
      "A documented invasive-plant occurrence is within approximately one kilometer.";
  } else if (distance <= 2500) {
    points = 4;
    explanation =
      "The nearest documented invasive occurrence is moderately far from the fire.";
  } else if (distance <= 5000) {
    points = 2;
    explanation =
      "The nearest documented invasive occurrence is several kilometers away.";
  } else {
    points = 1;
    explanation =
      "The fire is far from the combined set of documented invasive-plant observations.";
  }

  const distanceMiles =
    distance / 1609.344;

  return {
    label:
      "Nearest Invasive Observation",
    points: points,
    maximumPoints: 10,
    value: distance,
    displayValue:
      `${Math.round(
        distance
      ).toLocaleString()} m`,
    source: "Real GBIF Data",
    explanation:
      `${explanation} This is approximately ${distanceMiles.toFixed(
        2
      )} miles.`
  };
}


// ------------------------------------------------------------
// 11. DETERMINE OVERALL RISK LEVEL
// ------------------------------------------------------------

function getRiskLevel(percentage) {
  if (percentage >= 70) {
    return "High";
  }

  if (percentage >= 40) {
    return "Moderate";
  }

  return "Low";
}


// ------------------------------------------------------------
// 12. MAIN RISK FUNCTION
// ------------------------------------------------------------
// script.js calls calculateRisk(properties).

function calculateRisk(properties) {
  const safeProperties =
    properties &&
    typeof properties === "object"
      ? properties
      : {};

  const breakdown = {
    fireAge:
      scoreFireAge(
        safeProperties
      ),

    elevation:
      scoreElevation(
        safeProperties
      ),

    slope:
      scoreSlope(
        safeProperties
      ),

    aspect:
      scoreAspect(
        safeProperties
      ),

    roadDistance:
      scoreRoadDistance(
        safeProperties
      ),

    rainfall:
      scoreRainfall(
        safeProperties
      ),

    invasiveDistance:
      scoreInvasiveDistance(
        safeProperties
      )
  };

  const rawScore =
    Object.values(
      breakdown
    ).reduce(
      function(total, factor) {
        return (
          total +
          Number(factor.points || 0)
        );
      },
      0
    );

  const score =
    clamp(
      Math.round(rawScore),
      0,
      MAXIMUM_RISK_SCORE
    );

  const percentage =
    Math.round(
      (
        score /
        MAXIMUM_RISK_SCORE
      ) * 100
    );

  const level =
    getRiskLevel(
      percentage
    );

  return {
    score: score,
    maximumScore:
      MAXIMUM_RISK_SCORE,
    percentage: percentage,
    level: level,
    breakdown: breakdown
  };
}


// ------------------------------------------------------------
// 13. FIRE-POLYGON COLOR
// ------------------------------------------------------------

function getFireColor(score) {
  const numericScore =
    toValidNumber(score) ?? 0;

  const percentage =
    (
      numericScore /
      MAXIMUM_RISK_SCORE
    ) * 100;

  if (percentage >= 70) {
    return "#d73027";
  }

  if (percentage >= 40) {
    return "#fdae61";
  }

  return "#1a9850";
}