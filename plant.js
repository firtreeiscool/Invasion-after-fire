// ============================================================
// INVASION AFTER FIRE
// plant.js
//
// CNPS/Calscape-informed native-plant screening library.
//
// Scoring:
// - Elevation match:        38 points
// - Rainfall match:         20 points
// - Slope match:            10 points
// - Aspect match:           10 points
// - Restoration value:      20 points
// - Elevation-zone bonus:    2 points
//
// Raw total:               100 points
// Maximum displayed match:  97%
//
// The 97% ceiling reflects that GIS screening cannot replace
// field verification of soils, hydrology, natural regeneration,
// local plant communities, burn severity, and seed provenance.
// ============================================================

"use strict";


// ============================================================
// 1. MODEL CONSTANTS
// ============================================================

const FEET_PER_METER = 3.28084;

const MAX_SCREENING_MATCH = 97;

const PLANT_MODEL_METADATA = Object.freeze({
  libraryVersion: "2.2",

  sourceOrganization:
    "California Native Plant Society / Calscape",

  recommendationLabel:
    "Candidate native species for further evaluation",

  maximumDisplayedMatch:
    MAX_SCREENING_MATCH,

  disclaimer:
    "Matches use broad GIS conditions and ecological screening " +
    "traits. They are not automatic planting instructions or " +
    "official CNPS restoration prescriptions.",

  scoringWeights: {
    elevation: 38,
    rainfall: 20,
    slope: 10,
    aspect: 10,
    restorationValue: 20,
    elevationZoneBonus: 2
  },

  fieldChecks: [
    "Assess natural regeneration first",
    "Confirm the local plant community",
    "Check soil and drainage",
    "Check hydrology and nearby waterways",
    "Review burn severity",
    "Verify local occurrence",
    "Use locally sourced seed or plants",
    "Consult restoration professionals"
  ]
});


const ELEVATION_ZONES = Object.freeze({
  low: {
    label: "0–2,000 ft",
    minFeet: 0,
    maxFeet: 2000
  },

  mid: {
    label: "2,000–5,000 ft",
    minFeet: 2000,
    maxFeet: 5000
  },

  high: {
    label: "Above 5,000 ft",
    minFeet: 5000,
    maxFeet: 14000
  }
});


const STANDARD_VERIFICATION_FLAGS = Object.freeze([
  "Confirm local occurrence",
  "Check natural regeneration",
  "Verify soil and hydrology",
  "Review burn severity",
  "Use locally sourced material"
]);


// ============================================================
// 2. NATIVE-PLANT DATABASE
// ============================================================

const NATIVE_PLANTS = [

  // ==========================================================
  // LOW-ELEVATION GROUP: 0–2,000 FT
  // ==========================================================

  {
    id: "blue-oak",
    commonName: "Blue Oak",
    scientificName: "Quercus douglasii",
    elevationZone: "low",
    plantType: "Tree",

    minElevationFeet: 0,
    maxElevationFeet: 3500,

    minRainfallMm: 300,
    maxRainfallMm: 1100,

    maximumSlopeDegrees: 35,

    preferredAspects: [
      "South",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained clay, loam, or rocky soil",

    habitat:
      "Oak woodland and savanna",

    fireResponse:
      "Can resprout after fire; protect natural regeneration.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 4,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Oak woodland restoration",
      "Long-term slope stabilization",
      "Wildlife habitat",
      "Canopy recovery"
    ],

    restorationNotes:
      "Best for dry foothill woodland sites. Protect existing " +
      "resprouts and naturally occurring seedlings before " +
      "introducing additional trees.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Quercus%20douglasii"
    }
  },


  {
    id: "valley-oak",
    commonName: "Valley Oak",
    scientificName: "Quercus lobata",
    elevationZone: "low",
    plantType: "Tree",

    minElevationFeet: 0,
    maxElevationFeet: 2500,

    minRainfallMm: 350,
    maxRainfallMm: 1200,

    maximumSlopeDegrees: 20,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Full sun",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Deep alluvial loam or clay with seasonal moisture",

    habitat:
      "Valley bottoms, terraces, and riparian woodland",

    fireResponse:
      "May resprout; protect surviving trees and natural seedlings.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 4,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Valley woodland restoration",
      "Riparian woodland recovery",
      "Wildlife habitat",
      "Deep-soil stabilization"
    ],

    restorationNotes:
      "Consider only on deep-soil sites, valley bottoms, broad " +
      "terraces, and lower foothill drainages with suitable moisture.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Quercus%20lobata"
    }
  },


  {
    id: "interior-live-oak",
    commonName: "Interior Live Oak",
    scientificName: "Quercus wislizeni",
    elevationZone: "low",
    plantType: "Tree",

    minElevationFeet: 200,
    maxElevationFeet: 4500,

    minRainfallMm: 350,
    maxRainfallMm: 1400,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "North",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained loam, clay, or rocky soil",

    habitat:
      "Foothill woodland and canyon slopes",

    fireResponse:
      "Strong basal and crown resprouter.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Foothill woodland restoration",
      "Slope stabilization",
      "Wildlife habitat",
      "Resprouting canopy recovery"
    ],

    restorationNotes:
      "A strong candidate for foothill woodland and canyon sites " +
      "where the species is confirmed locally.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Quercus%20wislizeni"
    }
  },


  {
    id: "foothill-pine",
    commonName: "Foothill Pine",
    scientificName: "Pinus sabiniana",
    elevationZone: "low",
    plantType: "Tree",

    minElevationFeet: 300,
    maxElevationFeet: 4000,

    minRainfallMm: 300,
    maxRainfallMm: 1100,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "South",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Dry, rocky, well-drained soils",

    habitat:
      "Foothill woodland",

    fireResponse:
      "Regenerates mainly by seed; assess surrounding forest composition.",

    bloomSeason:
      "Winter–spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Foothill woodland recovery",
      "Dry-site tree cover",
      "Wildlife habitat",
      "Structural diversity"
    ],

    restorationNotes:
      "Appropriate for hot, dry foothill woodland sites. Do not " +
      "recommend for wetlands, meadows, or saturated soils.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pinus%20sabiniana"
    }
  },


  {
    id: "toyon",
    commonName: "Toyon",
    scientificName: "Heteromeles arbutifolia",
    elevationZone: "low",
    plantType: "Shrub",

    minElevationFeet: 0,
    maxElevationFeet: 4000,

    minRainfallMm: 350,
    maxRainfallMm: 1400,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "North",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Adaptable but best with good drainage",

    habitat:
      "Chaparral, woodland edges, and canyon slopes",

    fireResponse:
      "Strong resprouter.",

    bloomSeason:
      "Summer",

    ratings: {
      erosionControl: 4,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 5
    },

    restorationUses: [
      "Chaparral restoration",
      "Woodland-edge restoration",
      "Slope stabilization",
      "Bird and pollinator habitat"
    ],

    restorationNotes:
      "Useful on foothill slopes and woodland edges. Flowers and " +
      "fruits provide substantial wildlife value.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Heteromeles%20arbutifolia"
    }
  },


  {
    id: "california-coffeeberry",
    commonName: "California Coffeeberry",
    scientificName: "Frangula californica",
    elevationZone: "low",
    plantType: "Shrub",

    minElevationFeet: 0,
    maxElevationFeet: 5000,

    minRainfallMm: 400,
    maxRainfallMm: 1600,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Part shade to sun",
    waterNeed: "Low–moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Well-drained loam or clay; tolerates varied soils",

    habitat:
      "Woodland understory and chaparral",

    fireResponse:
      "Often resprouts after top-kill.",

    bloomSeason:
      "Spring–summer",

    ratings: {
      erosionControl: 4,
      fireRecovery: 4,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Woodland understory restoration",
      "Slope stabilization",
      "Bird habitat",
      "Native shrub cover"
    ],

    restorationNotes:
      "Most suitable on cooler foothill aspects, canyon slopes, " +
      "and woodland edges with moderate moisture.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Frangula%20californica"
    }
  },


  {
    id: "coyote-brush",
    commonName: "Coyote Brush",
    scientificName: "Baccharis pilularis",
    elevationZone: "low",
    plantType: "Shrub",

    minElevationFeet: 0,
    maxElevationFeet: 3000,

    minRainfallMm: 300,
    maxRainfallMm: 1200,

    maximumSlopeDegrees: 45,

    preferredAspects: [],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Adaptable, including disturbed and compacted soils",

    habitat:
      "Open slopes, scrub, and disturbed sites",

    fireResponse:
      "Rapid colonizer and possible resprouter.",

    bloomSeason:
      "Late summer–fall",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 4,
      pollinatorValue: 5
    },

    restorationUses: [
      "Rapid native cover",
      "Erosion control",
      "Pollinator habitat",
      "Disturbed-site stabilization"
    ],

    restorationNotes:
      "A fast-establishing shrub for appropriate open and " +
      "disturbed lower-elevation sites.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Baccharis%20pilularis"
    }
  },


  {
    id: "deergrass",
    commonName: "Deergrass",
    scientificName: "Muhlenbergia rigens",
    elevationZone: "low",
    plantType: "Grass",

    minElevationFeet: 0,
    maxElevationFeet: 4000,

    minRainfallMm: 300,
    maxRainfallMm: 1300,

    maximumSlopeDegrees: 30,

    preferredAspects: [],

    sunExposure: "Full sun",
    waterNeed: "Low–moderate",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained soil; tolerates seasonal moisture",

    habitat:
      "Grassland, drainage margins, and open woodland",

    fireResponse:
      "Perennial bunchgrass that can regrow from the crown.",

    bloomSeason:
      "Summer–fall",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Erosion control",
      "Drainage-margin restoration",
      "Native grass cover",
      "Soil stabilization"
    ],

    restorationNotes:
      "A deep-rooted bunchgrass for sunny foothill sites and " +
      "seasonally moist drainage margins.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Muhlenbergia%20rigens"
    }
  },


  {
    id: "purple-needlegrass",
    commonName: "Purple Needlegrass",
    scientificName: "Stipa pulchra",
    alternativeScientificName: "Nassella pulchra",
    elevationZone: "low",
    plantType: "Grass",

    minElevationFeet: 0,
    maxElevationFeet: 3500,

    minRainfallMm: 250,
    maxRainfallMm: 1000,

    maximumSlopeDegrees: 30,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained clay or loam",

    habitat:
      "Grassland and open oak woodland",

    fireResponse:
      "Perennial bunchgrass that may recover from crown and seed.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 5,
      fireRecovery: 4,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Native grassland restoration",
      "Erosion control",
      "Soil stabilization",
      "Open woodland understory"
    ],

    restorationNotes:
      "Best for sunny grassland and open oak woodland sites. " +
      "Use locally appropriate seed rather than generic seed mixes.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Stipa%20pulchra"
    }
  },


  {
    id: "blue-wildrye",
    commonName: "Blue Wildrye",
    scientificName: "Elymus glaucus",
    elevationZone: "low",
    plantType: "Grass",

    minElevationFeet: 200,
    maxElevationFeet: 6500,

    minRainfallMm: 400,
    maxRainfallMm: 1800,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "North",
      "Northeast",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Loam, clay loam, or forest soil with moderate moisture",

    habitat:
      "Woodland openings, meadows, and disturbed ground",

    fireResponse:
      "Can provide rapid native cover and reseed readily.",

    bloomSeason:
      "Spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Rapid native cover",
      "Erosion control",
      "Woodland understory",
      "Post-disturbance stabilization"
    ],

    restorationNotes:
      "A broad-ranging native grass useful for early cover, " +
      "especially where soil moisture is moderate.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Elymus%20glaucus"
    }
  },


  // ==========================================================
  // MIDDLE-ELEVATION GROUP: 2,000–5,000 FT
  // ==========================================================

  {
    id: "ponderosa-pine",
    commonName: "Ponderosa Pine",
    scientificName: "Pinus ponderosa",
    elevationZone: "mid",
    plantType: "Tree",

    minElevationFeet: 1800,
    maxElevationFeet: 6500,

    minRainfallMm: 500,
    maxRainfallMm: 1800,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low–moderate",
    droughtTolerance: "High",

    soilAndDrainage:
      "Deep, well-drained sandy loam to gravelly soils",

    habitat:
      "Yellow-pine and mixed-conifer forest",

    fireResponse:
      "Mature trees can tolerate lower-severity fire; seedlings are vulnerable.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 4,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Mixed-conifer forest restoration",
      "Long-term canopy recovery",
      "Wildlife habitat",
      "Forest structure"
    ],

    restorationNotes:
      "Suitable for open, sunny forest sites where it naturally " +
      "occurs. Avoid creating dense, uniform plantations.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pinus%20ponderosa"
    }
  },


  {
    id: "incense-cedar",
    commonName: "Incense Cedar",
    scientificName: "Calocedrus decurrens",
    elevationZone: "mid",
    plantType: "Tree",

    minElevationFeet: 1800,
    maxElevationFeet: 7000,

    minRainfallMm: 650,
    maxRainfallMm: 2200,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Well-drained forest loam; tolerates varied substrates",

    habitat:
      "Mixed-conifer forest",

    fireResponse:
      "Mature trees may survive lower-severity fire.",

    bloomSeason:
      "Winter–spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 4,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Mixed-conifer restoration",
      "Shaded-slope recovery",
      "Forest structure",
      "Wildlife cover"
    ],

    restorationNotes:
      "Best on moderately moist forest sites and cooler aspects. " +
      "Use as part of a natural species mixture.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Calocedrus%20decurrens"
    }
  },


  {
    id: "california-black-oak",
    commonName: "California Black Oak",
    scientificName: "Quercus kelloggii",
    elevationZone: "mid",
    plantType: "Tree",

    minElevationFeet: 1500,
    maxElevationFeet: 7000,

    minRainfallMm: 550,
    maxRainfallMm: 2000,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Well-drained forest loam, often on slopes",

    habitat:
      "Oak woodland and mixed-conifer forest",

    fireResponse:
      "Strong crown resprouter.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Oak woodland recovery",
      "Mixed-conifer restoration",
      "Wildlife food and habitat",
      "Resprouting canopy recovery"
    ],

    restorationNotes:
      "Existing resprouting trees should be protected before " +
      "additional seedlings are introduced.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Quercus%20kelloggii"
    }
  },


  {
    id: "douglas-fir",
    commonName: "Douglas Fir",
    scientificName: "Pseudotsuga menziesii",
    elevationZone: "mid",
    plantType: "Tree",

    minElevationFeet: 2200,
    maxElevationFeet: 6500,

    minRainfallMm: 750,
    maxRainfallMm: 2400,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Low–moderate",

    soilAndDrainage:
      "Deep, well-drained, cooler forest soils",

    habitat:
      "Moist mixed-conifer forest",

    fireResponse:
      "Older trees have some fire tolerance; regeneration occurs by seed.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Moist mixed-conifer restoration",
      "Long-term forest canopy",
      "Wildlife habitat",
      "Cool-slope recovery"
    ],

    restorationNotes:
      "Consider for cooler and moister sites. It should not be " +
      "recommended for hot, exposed foothill slopes.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pseudotsuga%20menziesii"
    }
  },


  {
    id: "pacific-madrone",
    commonName: "Pacific Madrone",
    scientificName: "Arbutus menziesii",
    elevationZone: "mid",
    plantType: "Tree",

    minElevationFeet: 1000,
    maxElevationFeet: 5000,

    minRainfallMm: 650,
    maxRainfallMm: 2000,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Low–moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Well-drained rocky or loamy soils; avoid saturation",

    habitat:
      "Mixed evergreen woodland and forest edges",

    fireResponse:
      "Vigorous basal resprouter.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 5
    },

    restorationUses: [
      "Woodland restoration",
      "Slope stabilization",
      "Pollinator support",
      "Bird habitat"
    ],

    restorationNotes:
      "Suitable for appropriate woodland slopes. Avoid compacted " +
      "or persistently saturated soils.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Arbutus%20menziesii"
    }
  },


  {
    id: "deerbrush",
    commonName: "Deerbrush",
    scientificName: "Ceanothus integerrimus",
    elevationZone: "mid",
    plantType: "Shrub",

    minElevationFeet: 1800,
    maxElevationFeet: 7000,

    minRainfallMm: 500,
    maxRainfallMm: 1800,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun to part shade",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained rocky or sandy soils",

    habitat:
      "Forest openings, chaparral, and yellow-pine forest",

    fireResponse:
      "Fire-stimulated seed bank and possible crown sprouting.",

    bloomSeason:
      "Late spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 5
    },

    restorationUses: [
      "Post-fire shrub recovery",
      "Nitrogen fixation",
      "Erosion control",
      "Pollinator and wildlife habitat"
    ],

    restorationNotes:
      "May germinate naturally after fire. Check for existing " +
      "post-fire recruitment before planting or seeding.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Ceanothus%20integerrimus"
    }
  },


  {
    id: "whiteleaf-manzanita",
    commonName: "Whiteleaf Manzanita",
    scientificName: "Arctostaphylos viscida",
    elevationZone: "mid",
    plantType: "Shrub",

    minElevationFeet: 1000,
    maxElevationFeet: 5500,

    minRainfallMm: 400,
    maxRainfallMm: 1500,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Dry, rocky, well-drained soils",

    habitat:
      "Chaparral and lower-montane woodland",

    fireResponse:
      "Fire-cued seed germination; response varies among populations.",

    bloomSeason:
      "Winter–spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 5
    },

    restorationUses: [
      "Chaparral recovery",
      "Dry-slope stabilization",
      "Pollinator habitat",
      "Wildlife cover"
    ],

    restorationNotes:
      "Natural post-fire germination may already be abundant. " +
      "Survey the site before adding new material.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Arctostaphylos%20viscida"
    }
  },


  {
    id: "california-yerba-santa",
    commonName: "California Yerba Santa",
    scientificName: "Eriodictyon californicum",
    elevationZone: "mid",
    plantType: "Shrub",

    minElevationFeet: 500,
    maxElevationFeet: 6000,

    minRainfallMm: 400,
    maxRainfallMm: 1600,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Dry, disturbed, rocky, or gravelly soils",

    habitat:
      "Open slopes, chaparral, and disturbed forest",

    fireResponse:
      "Strong post-fire sprouter and colonizer.",

    bloomSeason:
      "Spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 4,
      pollinatorValue: 5
    },

    restorationUses: [
      "Post-fire shrub cover",
      "Erosion control",
      "Pollinator habitat",
      "Disturbed-slope recovery"
    ],

    restorationNotes:
      "Frequently recolonizes burned slopes naturally. Confirm " +
      "whether intervention is needed.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Eriodictyon%20californicum"
    }
  },


  {
    id: "california-fescue",
    commonName: "California Fescue",
    scientificName: "Festuca californica",
    elevationZone: "mid",
    plantType: "Grass",

    minElevationFeet: 1000,
    maxElevationFeet: 6000,

    minRainfallMm: 550,
    maxRainfallMm: 2000,

    maximumSlopeDegrees: 40,

    preferredAspects: [
      "North",
      "Northeast",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Well-drained loam and woodland soil",

    habitat:
      "Woodland openings and shaded grassland",

    fireResponse:
      "Perennial bunchgrass capable of crown regrowth.",

    bloomSeason:
      "Spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 4,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Erosion control",
      "Woodland understory",
      "Native bunchgrass recovery",
      "Slope stabilization"
    ],

    restorationNotes:
      "Best on moderately moist slopes and woodland openings. " +
      "Verify local seed origin.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Festuca%20californica"
    }
  },


  {
    id: "mountain-misery",
    commonName: "Mountain Misery",
    scientificName: "Chamaebatia foliolosa",
    elevationZone: "mid",
    plantType: "Low shrub",

    minElevationFeet: 2000,
    maxElevationFeet: 7000,

    minRainfallMm: 550,
    maxRainfallMm: 1900,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "East",
      "West"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Low–moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Dry, well-drained forest soils",

    habitat:
      "Sierra mixed-conifer understory",

    fireResponse:
      "Rhizomatous resprouter.",

    bloomSeason:
      "Late spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 3,
      pollinatorValue: 4
    },

    restorationUses: [
      "Forest-floor recovery",
      "Erosion control",
      "Low native cover",
      "Mixed-conifer understory"
    ],

    restorationNotes:
      "A characteristic Sierra Nevada understory plant that can " +
      "spread after disturbance. Check natural recovery first.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Chamaebatia%20foliolosa"
    }
  },


  // ==========================================================
  // HIGH-ELEVATION GROUP: ABOVE 5,000 FT
  // ==========================================================

  {
    id: "jeffrey-pine",
    commonName: "Jeffrey Pine",
    scientificName: "Pinus jeffreyi",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 5000,
    maxElevationFeet: 9500,

    minRainfallMm: 450,
    maxRainfallMm: 1800,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low–moderate",
    droughtTolerance: "High",

    soilAndDrainage:
      "Well-drained granitic, volcanic, or sandy soils",

    habitat:
      "Upper-montane forest",

    fireResponse:
      "Mature trees tolerate lower-severity fire; regeneration occurs by seed.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 4,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Upper-montane forest restoration",
      "Dry forest cover",
      "Wildlife habitat",
      "Long-term canopy recovery"
    ],

    restorationNotes:
      "Consider where Jeffrey pine occurs naturally in nearby " +
      "stands and the site is sunny and well drained.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pinus%20jeffreyi"
    }
  },


  {
    id: "sierra-lodgepole-pine",
    commonName: "Sierra Lodgepole Pine",
    scientificName: "Pinus contorta subsp. murrayana",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 5500,
    maxElevationFeet: 11000,

    minRainfallMm: 600,
    maxRainfallMm: 2200,

    maximumSlopeDegrees: 35,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Full sun",
    waterNeed: "Moderate–high",
    droughtTolerance: "Low",

    soilAndDrainage:
      "Moist, cold soils on flats and meadow margins",

    habitat:
      "Upper-montane forest and meadow margins",

    fireResponse:
      "Regenerates primarily by seed.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "High-elevation forest restoration",
      "Meadow-edge recovery",
      "Cold-site canopy restoration",
      "Wildlife cover"
    ],

    restorationNotes:
      "Consider only where cold, moist site conditions and local " +
      "lodgepole-pine populations are confirmed.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pinus%20contorta%20murrayana"
    }
  },


  {
    id: "red-fir",
    commonName: "Red Fir",
    scientificName: "Abies magnifica",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 5500,
    maxElevationFeet: 9500,

    minRainfallMm: 850,
    maxRainfallMm: 2600,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate–high",
    droughtTolerance: "Low",

    soilAndDrainage:
      "Cool, moist, well-drained mountain soils",

    habitat:
      "Red-fir forest",

    fireResponse:
      "Regenerates by seed and is sensitive to high-severity fire.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Red-fir forest restoration",
      "High-elevation canopy recovery",
      "Wildlife habitat",
      "Snow-zone forest structure"
    ],

    restorationNotes:
      "Suitable for cool and snowy upper-montane forest sites. " +
      "It is inappropriate for dry foothill conditions.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Abies%20magnifica"
    }
  },


  {
    id: "white-fir",
    commonName: "White Fir",
    scientificName: "Abies concolor",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 4000,
    maxElevationFeet: 9000,

    minRainfallMm: 700,
    maxRainfallMm: 2400,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Deep, well-drained forest soils",

    habitat:
      "Mixed-conifer and upper-montane forest",

    fireResponse:
      "Mature trees tolerate some fire; dense regeneration may increase fuels.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Mixed-conifer restoration",
      "Cool-slope canopy recovery",
      "Wildlife cover",
      "Upper-montane forest structure"
    ],

    restorationNotes:
      "Use selectively and in natural mixtures. Avoid creating " +
      "unnaturally dense fir stands.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Abies%20concolor"
    }
  },


  {
    id: "western-white-pine",
    commonName: "Western White Pine",
    scientificName: "Pinus monticola",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 5000,
    maxElevationFeet: 10500,

    minRainfallMm: 700,
    maxRainfallMm: 2300,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Full sun",
    waterNeed: "Moderate",
    droughtTolerance: "Moderate",

    soilAndDrainage:
      "Cool, well-drained mountain soils",

    habitat:
      "Upper-montane and subalpine forest",

    fireResponse:
      "Regenerates by seed; evaluate disease risk and local presence.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 3,
      wildlifeValue: 5,
      pollinatorValue: 2
    },

    restorationUses: [
      "Upper-montane forest diversity",
      "Long-term canopy recovery",
      "Wildlife habitat",
      "High-elevation conifer restoration"
    ],

    restorationNotes:
      "Consider only where it naturally occurs locally and site " +
      "exposure, snowpack, and disease risks are evaluated.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Pinus%20monticola"
    }
  },


  {
    id: "mountain-hemlock",
    commonName: "Mountain Hemlock",
    scientificName: "Tsuga mertensiana",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 6500,
    maxElevationFeet: 11500,

    minRainfallMm: 900,
    maxRainfallMm: 2800,

    maximumSlopeDegrees: 50,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "High",
    droughtTolerance: "Low",

    soilAndDrainage:
      "Cold, moist, snowy mountain soils",

    habitat:
      "Subalpine forest",

    fireResponse:
      "Regenerates by seed and has relatively low fire tolerance.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 3,
      fireRecovery: 2,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Subalpine forest restoration",
      "Snow-zone canopy recovery",
      "Wildlife cover",
      "Cool high-elevation habitat"
    ],

    restorationNotes:
      "Consider only for cool and snowy subalpine locations with " +
      "appropriate local populations.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Tsuga%20mertensiana"
    }
  },


  {
    id: "sierra-juniper",
    commonName: "Sierra Juniper",
    scientificName: "Juniperus grandis",
    elevationZone: "high",
    plantType: "Tree",

    minElevationFeet: 5000,
    maxElevationFeet: 11500,

    minRainfallMm: 350,
    maxRainfallMm: 1500,

    maximumSlopeDegrees: 55,

    preferredAspects: [
      "South",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Dry, rocky, exposed soils",

    habitat:
      "Rocky upper-montane and subalpine slopes",

    fireResponse:
      "Slow recovery and primarily seed-based regeneration.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 4,
      fireRecovery: 2,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Rocky high-elevation slope recovery",
      "Dry-site forest structure",
      "Wildlife habitat",
      "Wind-exposed site restoration"
    ],

    restorationNotes:
      "A slow-growing tree for dry, rocky high-elevation locations. " +
      "It is not a rapid erosion-control species.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Juniperus%20grandis"
    }
  },


  {
    id: "mountain-alder",
    commonName: "Mountain Alder",
    scientificName: "Alnus incana subsp. tenuifolia",
    elevationZone: "high",
    plantType: "Shrub or small tree",

    minElevationFeet: 4000,
    maxElevationFeet: 10000,

    minRainfallMm: 650,
    maxRainfallMm: 2600,

    maximumSlopeDegrees: 35,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Sun to part shade",
    waterNeed: "High",
    droughtTolerance: "Low",

    soilAndDrainage:
      "Wet alluvial soil, streambanks, and seeps",

    habitat:
      "Riparian corridors and wet-meadow edges",

    fireResponse:
      "Strong resprouter and nitrogen fixer.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 4
    },

    restorationUses: [
      "Streambank stabilization",
      "Riparian restoration",
      "Nitrogen fixation",
      "Wet-slope recovery"
    ],

    restorationNotes:
      "Consider only where field surveys confirm riparian, spring-fed, " +
      "meadow-edge, or otherwise moist conditions.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Alnus%20incana%20tenuifolia"
    }
  },


  {
    id: "lemmons-willow",
    commonName: "Lemmon's Willow",
    scientificName: "Salix lemmonii",
    elevationZone: "high",
    plantType: "Shrub",

    minElevationFeet: 4500,
    maxElevationFeet: 10000,

    minRainfallMm: 650,
    maxRainfallMm: 2600,

    maximumSlopeDegrees: 30,

    preferredAspects: [
      "North",
      "Northeast",
      "East"
    ],

    sunExposure: "Full sun",
    waterNeed: "High",
    droughtTolerance: "Low",

    soilAndDrainage:
      "Wet soils along streams and meadows",

    habitat:
      "Riparian zones and wet meadows",

    fireResponse:
      "Vigorous resprouter; may establish from local cuttings.",

    bloomSeason:
      "Spring",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 5,
      pollinatorValue: 5
    },

    restorationUses: [
      "Streambank stabilization",
      "Wet-meadow restoration",
      "Riparian wildlife habitat",
      "Erosion control"
    ],

    restorationNotes:
      "Consider only where streams, seeps, wet meadows, or shallow " +
      "groundwater are confirmed.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Salix%20lemmonii"
    }
  },


  {
    id: "squirreltail",
    commonName: "Squirreltail",
    scientificName: "Elymus elymoides",
    elevationZone: "high",
    plantType: "Grass",

    minElevationFeet: 3500,
    maxElevationFeet: 11000,

    minRainfallMm: 250,
    maxRainfallMm: 1400,

    maximumSlopeDegrees: 45,

    preferredAspects: [
      "South",
      "Southeast",
      "Southwest",
      "West"
    ],

    sunExposure: "Full sun",
    waterNeed: "Low",
    droughtTolerance: "High",

    soilAndDrainage:
      "Dry, well-drained sandy, gravelly, or rocky soils",

    habitat:
      "Dry forest openings and uplands",

    fireResponse:
      "Perennial bunchgrass that establishes from seed.",

    bloomSeason:
      "Spring–summer",

    ratings: {
      erosionControl: 5,
      fireRecovery: 5,
      wildlifeValue: 4,
      pollinatorValue: 2
    },

    restorationUses: [
      "Dry-upland erosion control",
      "Native grass recovery",
      "Open-forest restoration",
      "Competition with annual invasive grasses"
    ],

    restorationNotes:
      "Useful on appropriate dry upper-montane openings and " +
      "disturbed uplands. Use locally appropriate seed.",

    source: {
      name: "CNPS Calscape",
      profileSearch:
        "https://calscape.org/search?query=Elymus%20elymoides"
    }
  }

];


// ============================================================
// 3. ADD STANDARD VERIFICATION FLAGS
// ============================================================

NATIVE_PLANTS.forEach(function(plant) {
  plant.verificationFlags = [
    ...STANDARD_VERIFICATION_FLAGS
  ];
});


// ============================================================
// 4. ASPECT DIRECTION
// ============================================================

function plantAspectDirection(degrees) {
  const value = Number(degrees);

  if (!Number.isFinite(value)) {
    return null;
  }

  const normalized =
    ((value % 360) + 360) % 360;

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


// ============================================================
// 5. ELEVATION GROUP
// ============================================================

function plantElevationZone(elevationFeet) {
  const value = Number(elevationFeet);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value < 2000) {
    return "low";
  }

  if (value < 5000) {
    return "mid";
  }

  return "high";
}


// ============================================================
// 6. RANGE SCORING
// ============================================================

function scorePlantRange(
  value,
  minimum,
  maximum,
  transitionDistance
) {
  const numericValue =
    Number(value);

  const numericMinimum =
    Number(minimum);

  const numericMaximum =
    Number(maximum);

  const transition =
    Number(transitionDistance);

  if (
    !Number.isFinite(numericValue) ||
    !Number.isFinite(numericMinimum) ||
    !Number.isFinite(numericMaximum) ||
    !Number.isFinite(transition) ||
    transition <= 0
  ) {
    return 0.5;
  }

  if (
    numericValue >= numericMinimum &&
    numericValue <= numericMaximum
  ) {
    return 1;
  }

  const distance =
    numericValue < numericMinimum
      ? numericMinimum - numericValue
      : numericValue - numericMaximum;

  return Math.max(
    0,
    1 - distance / transition
  );
}


// ============================================================
// 7. RESTORATION-VALUE SCORE
// ============================================================

function getPlantRestorationAverage(ratings) {
  if (
    !ratings ||
    typeof ratings !== "object"
  ) {
    return 0.5;
  }

  const values = [
    Number(ratings.erosionControl),
    Number(ratings.fireRecovery),
    Number(ratings.wildlifeValue),
    Number(ratings.pollinatorValue)
  ].filter(Number.isFinite);

  if (values.length === 0) {
    return 0.5;
  }

  const total =
    values.reduce(
      function(sum, value) {
        return sum + value;
      },
      0
    );

  return total / (values.length * 5);
}


// ============================================================
// 8. IDENTIFY WET-SITE SPECIES
// ============================================================

function plantNeedsWetConditions(plant) {
  const text = [
    plant.waterNeed,
    plant.soilAndDrainage,
    plant.habitat,
    plant.restorationNotes
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("wet") ||
    text.includes("riparian") ||
    text.includes("stream") ||
    text.includes("meadow") ||
    text.includes("seep") ||
    text.includes("groundwater")
  );
}


// ============================================================
// 9. CALCULATE ONE PLANT MATCH
// ============================================================

function calculateNativePlantMatch(
  plant,
  fireProperties = {}
) {
  const properties =
    fireProperties &&
    typeof fireProperties === "object"
      ? fireProperties
      : {};


  // ----------------------------------------------------------
  // Site conditions
  // ----------------------------------------------------------

  const elevationMeters =
    Number(properties.elev_mean);

  const elevationFeet =
    Number.isFinite(elevationMeters)
      ? elevationMeters * FEET_PER_METER
      : null;

  const rainfallMm =
    Number(properties.rainfall_mean);

  const slopeDegrees =
    Number(properties.slope_mean);

  const aspectDirection =
    plantAspectDirection(
      properties.aspect_mean
    );

  const siteZone =
    plantElevationZone(
      elevationFeet
    );


  // ----------------------------------------------------------
  // Component scores
  // ----------------------------------------------------------

  const elevationScore =
    scorePlantRange(
      elevationFeet,
      plant.minElevationFeet,
      plant.maxElevationFeet,
      1500
    );

  const rainfallScore =
    scorePlantRange(
      rainfallMm,
      plant.minRainfallMm,
      plant.maxRainfallMm,
      600
    );


  let slopeScore = 0.5;

  if (Number.isFinite(slopeDegrees)) {
    if (
      slopeDegrees <=
      plant.maximumSlopeDegrees
    ) {
      slopeScore = 1;
    } else {
      slopeScore = Math.max(
        0,
        1 -
          (
            slopeDegrees -
            plant.maximumSlopeDegrees
          ) /
          25
      );
    }
  }


  let aspectScore = 0.75;

  if (
    aspectDirection &&
    Array.isArray(
      plant.preferredAspects
    )
  ) {
    if (
      plant.preferredAspects.length === 0
    ) {
      aspectScore = 1;
    } else if (
      plant.preferredAspects.includes(
        aspectDirection
      )
    ) {
      aspectScore = 1;
    } else {
      aspectScore = 0.6;
    }
  }


  const restorationScore =
    getPlantRestorationAverage(
      plant.ratings
    );


  const zoneBonus =
    siteZone === plant.elevationZone
      ? 2
      : 0;


  // ----------------------------------------------------------
  // Weighted raw score
  // ----------------------------------------------------------

  const rawScore =
    elevationScore * 38 +
    rainfallScore * 20 +
    slopeScore * 10 +
    aspectScore * 10 +
    restorationScore * 20 +
    zoneBonus;


  // ----------------------------------------------------------
  // Displayed score
  //
  // The raw score may reach 100, but the displayed screening
  // score is capped at 97 because field verification is still
  // required before restoration decisions.
  // ----------------------------------------------------------

  const matchPercentage =
    Math.round(
      Math.min(
        MAX_SCREENING_MATCH,
        Math.max(0, rawScore)
      )
    );


  // ----------------------------------------------------------
  // Match explanations
  // ----------------------------------------------------------

  const reasons = [];


  if (elevationScore >= 0.9) {
    reasons.push(
      "Elevation is within the screening range"
    );
  } else if (elevationScore >= 0.5) {
    reasons.push(
      "Elevation is near the screening range"
    );
  } else {
    reasons.push(
      "Elevation needs careful verification"
    );
  }


  if (rainfallScore >= 0.9) {
    reasons.push(
      "Annual rainfall is within the screening range"
    );
  } else if (rainfallScore >= 0.5) {
    reasons.push(
      "Annual rainfall is near the screening range"
    );
  } else {
    reasons.push(
      "Rainfall suitability is uncertain"
    );
  }


  if (slopeScore >= 0.9) {
    reasons.push(
      "Mean slope is within the screening tolerance"
    );
  } else if (slopeScore >= 0.5) {
    reasons.push(
      "Mean slope is near the screening tolerance"
    );
  }


  if (aspectScore >= 0.9) {
    if (aspectDirection) {
      reasons.push(
        `Compatible with ${aspectDirection.toLowerCase()} exposure`
      );
    } else {
      reasons.push(
        "Aspect-flexible species"
      );
    }
  }


  if (
    plant.ratings.erosionControl >= 4
  ) {
    reasons.push(
      "Strong erosion-control potential"
    );
  }


  if (
    plant.ratings.fireRecovery >= 4
  ) {
    reasons.push(
      "Strong post-fire recovery potential"
    );
  }


  if (
    plant.ratings.pollinatorValue >= 4
  ) {
    reasons.push(
      "High pollinator value"
    );
  }


  if (
    plant.ratings.wildlifeValue >= 4
  ) {
    reasons.push(
      "High wildlife value"
    );
  }


  // ----------------------------------------------------------
  // Verification cautions
  // ----------------------------------------------------------

  const cautions = [
    ...plant.verificationFlags
  ];


  if (plantNeedsWetConditions(plant)) {
    cautions.unshift(
      "Only consider where field-verified hydrology is suitable"
    );
  }


  if (
    String(plant.plantType)
      .toLowerCase()
      .includes("tree")
  ) {
    cautions.push(
      "Confirm historic vegetation type and appropriate planting density"
    );
  }


  // ----------------------------------------------------------
  // Return recommendation object
  // ----------------------------------------------------------

  return {
    ...plant,

    matchPercentage:
      matchPercentage,

    rawModelScore:
      Number(
        rawScore.toFixed(1)
      ),

    scoreWasCapped:
      rawScore >
      MAX_SCREENING_MATCH,

    maximumDisplayedMatch:
      MAX_SCREENING_MATCH,

    reasons:
      reasons.slice(0, 6),

    cautions:
      [...new Set(cautions)]
        .slice(0, 6),

    siteConditions: {
      elevationFeet:
        elevationFeet,

      rainfallMm:
        rainfallMm,

      slopeDegrees:
        slopeDegrees,

      aspect:
        aspectDirection,

      elevationZone:
        siteZone
    },

    componentScores: {
      elevation:
        Math.round(
          elevationScore * 100
        ),

      rainfall:
        Math.round(
          rainfallScore * 100
        ),

      slope:
        Math.round(
          slopeScore * 100
        ),

      aspect:
        Math.round(
          aspectScore * 100
        ),

      restorationValue:
        Math.round(
          restorationScore * 100
        ),

      elevationZoneBonus:
        zoneBonus
    },

    weightedPoints: {
      elevation:
        Number(
          (
            elevationScore * 38
          ).toFixed(1)
        ),

      rainfall:
        Number(
          (
            rainfallScore * 20
          ).toFixed(1)
        ),

      slope:
        Number(
          (
            slopeScore * 10
          ).toFixed(1)
        ),

      aspect:
        Number(
          (
            aspectScore * 10
          ).toFixed(1)
        ),

      restorationValue:
        Number(
          (
            restorationScore * 20
          ).toFixed(1)
        ),

      elevationZoneBonus:
        zoneBonus
    },

    modelLabel:
      PLANT_MODEL_METADATA
        .recommendationLabel
  };
}


// ============================================================
// 10. GET TOP RECOMMENDATIONS
// ============================================================

function getNativePlantRecommendations(
  fireProperties,
  limit = 5
) {
  const parsedLimit =
    Number.parseInt(limit, 10);

  const safeLimit =
    Number.isInteger(parsedLimit)
      ? Math.max(1, parsedLimit)
      : 5;


  return NATIVE_PLANTS
    .map(function(plant) {
      return calculateNativePlantMatch(
        plant,
        fireProperties
      );
    })

    .filter(function(result) {
      return (
        result.matchPercentage >= 40
      );
    })

    .sort(function(first, second) {
      /*
       * Sort first by the uncapped model score.
       *
       * This allows two plants that both display 97% to remain
       * correctly ranked based on their actual underlying score.
       */

      if (
        second.rawModelScore !==
        first.rawModelScore
      ) {
        return (
          second.rawModelScore -
          first.rawModelScore
        );
      }

      if (
        second.ratings.fireRecovery !==
        first.ratings.fireRecovery
      ) {
        return (
          second.ratings.fireRecovery -
          first.ratings.fireRecovery
        );
      }

      return first.commonName.localeCompare(
        second.commonName
      );
    })

    .slice(
      0,
      safeLimit
    );
}


// ============================================================
// 11. GET PLANTS BY ELEVATION GROUP
// ============================================================

function getNativePlantsByElevationZone(
  zone
) {
  const normalized =
    String(zone || "")
      .trim()
      .toLowerCase();

  return NATIVE_PLANTS.filter(
    function(plant) {
      return (
        plant.elevationZone ===
        normalized
      );
    }
  );
}


// ============================================================
// 12. FIND PLANT BY ID
// ============================================================

function getNativePlantById(plantId) {
  const normalized =
    String(plantId || "")
      .trim()
      .toLowerCase();

  return (
    NATIVE_PLANTS.find(
      function(plant) {
        return (
          plant.id.toLowerCase() ===
          normalized
        );
      }
    ) || null
  );
}


// ============================================================
// 13. VALIDATE DATABASE AND SCORING MODEL
// ============================================================

function validateNativePlantDatabase() {
  const errors = [];
  const ids = new Set();

  const requiredFields = [
    "id",
    "commonName",
    "scientificName",
    "elevationZone",
    "plantType",
    "minElevationFeet",
    "maxElevationFeet",
    "minRainfallMm",
    "maxRainfallMm",
    "maximumSlopeDegrees",
    "ratings"
  ];


  NATIVE_PLANTS.forEach(
    function(plant, index) {
      requiredFields.forEach(
        function(field) {
          if (
            plant[field] === undefined ||
            plant[field] === null ||
            plant[field] === ""
          ) {
            errors.push(
              `Plant ${index + 1} is missing ${field}.`
            );
          }
        }
      );


      if (ids.has(plant.id)) {
        errors.push(
          `Duplicate plant ID: ${plant.id}`
        );
      }

      ids.add(plant.id);


      if (
        plant.minElevationFeet >
        plant.maxElevationFeet
      ) {
        errors.push(
          `Invalid elevation range: ${plant.id}`
        );
      }


      if (
        plant.minRainfallMm >
        plant.maxRainfallMm
      ) {
        errors.push(
          `Invalid rainfall range: ${plant.id}`
        );
      }
    }
  );


  const lowCount =
    getNativePlantsByElevationZone(
      "low"
    ).length;

  const midCount =
    getNativePlantsByElevationZone(
      "mid"
    ).length;

  const highCount =
    getNativePlantsByElevationZone(
      "high"
    ).length;


  if (lowCount !== 10) {
    errors.push(
      `Expected 10 low-elevation plants; found ${lowCount}.`
    );
  }


  if (midCount !== 10) {
    errors.push(
      `Expected 10 middle-elevation plants; found ${midCount}.`
    );
  }


  if (highCount !== 10) {
    errors.push(
      `Expected 10 high-elevation plants; found ${highCount}.`
    );
  }


  if (NATIVE_PLANTS.length !== 30) {
    errors.push(
      `Expected 30 total plants; found ${NATIVE_PLANTS.length}.`
    );
  }


  const scoringTotal =
    PLANT_MODEL_METADATA
      .scoringWeights
      .elevation +
    PLANT_MODEL_METADATA
      .scoringWeights
      .rainfall +
    PLANT_MODEL_METADATA
      .scoringWeights
      .slope +
    PLANT_MODEL_METADATA
      .scoringWeights
      .aspect +
    PLANT_MODEL_METADATA
      .scoringWeights
      .restorationValue +
    PLANT_MODEL_METADATA
      .scoringWeights
      .elevationZoneBonus;


  if (scoringTotal !== 100) {
    errors.push(
      `Scoring weights total ${scoringTotal}, not 100.`
    );
  }


  if (
    !Number.isFinite(
      MAX_SCREENING_MATCH
    ) ||
    MAX_SCREENING_MATCH <= 0 ||
    MAX_SCREENING_MATCH > 100
  ) {
    errors.push(
      "MAX_SCREENING_MATCH must be between 1 and 100."
    );
  }


  if (errors.length > 0) {
    console.error(
      "Native plant database validation failed:",
      errors
    );

    return false;
  }


  console.log(
    "Native plant database ready:",
    {
      total:
        NATIVE_PLANTS.length,

      low:
        lowCount,

      mid:
        midCount,

      high:
        highCount,

      scoringTotal:
        scoringTotal,

      maximumDisplayedMatch:
        MAX_SCREENING_MATCH,

      version:
        PLANT_MODEL_METADATA
          .libraryVersion
    }
  );

  return true;
}


// ============================================================
// 14. EXPOSE API TO OTHER JAVASCRIPT FILES
// ============================================================

window.NATIVE_PLANTS =
  NATIVE_PLANTS;

window.PLANT_MODEL_METADATA =
  PLANT_MODEL_METADATA;

window.MAX_SCREENING_MATCH =
  MAX_SCREENING_MATCH;

window.calculateNativePlantMatch =
  calculateNativePlantMatch;

window.getNativePlantRecommendations =
  getNativePlantRecommendations;

window.getNativePlantsByElevationZone =
  getNativePlantsByElevationZone;

window.getNativePlantById =
  getNativePlantById;


// ============================================================
// 15. VALIDATE WHEN FILE LOADS
// ============================================================

validateNativePlantDatabase();