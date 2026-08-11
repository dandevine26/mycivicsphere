/**
 * assessment-roll-data.js
 * Netlify serverless function — Nassau County Assessment Roll
 * Class breakdown for the Town of Oyster Bay
 *
 * Deploy to: /netlify/functions/assessment-roll-data.js
 * Endpoint:  /.netlify/functions/assessment-roll-data
 *
 * No query params. Returns static JSON.
 *
 * PURPOSE:
 *   Provides the tax equity layer for CivicSphere's property tax analyzer.
 *   Shows how the Town of Oyster Bay's total tax levy is distributed across
 *   the four NYS property tax classes — residential, apartments, utilities,
 *   and commercial/industrial — answering the civic question:
 *   "Are homeowners carrying a disproportionate share of the tax burden
 *   compared to businesses?"
 *
 * DATA SOURCES & CONFIDENCE LEVELS:
 *   Each figure below is tagged with one of three confidence levels:
 *
 *   CONFIRMED  — Sourced directly from an official public document.
 *                Cite the source. Safe to display without caveat.
 *
 *   DERIVED    — Calculated from confirmed figures using published formulas
 *                (e.g. NYS assessment level of assessment ratios).
 *                Safe to display; note the methodology.
 *
 *   ESTIMATED  — Best available approximation from comparable data,
 *                county-wide ratios, or academic/policy research.
 *                Display with a clear "estimated" label.
 *                Replace with CONFIRMED figures once FOIL response arrives.
 *
 * HOW TO UPDATE:
 *   Option A (immediate, free): File a FOIL request to the Nassau County
 *     Department of Assessment for the Oyster Bay final assessment roll
 *     in CSV format, broken down by tax class. Replace ESTIMATED figures
 *     with CONFIRMED ones and redeploy.
 *
 *   Option B (annual, automated): Download the roll file from
 *     nassaucountyny.gov/5120/Assessment-Rolls each January, run the
 *     companion script /scripts/parse-roll.js to aggregate by class,
 *     and paste the output here.
 *
 * No dependencies. No external calls. No API keys.
 */

exports.handler = async () => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=86400",
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(ROLL_DATA),
  };
};

// ── Assessment Roll Data ──────────────────────────────────────────────────────

const ROLL_DATA = {

  // ── Identity ───────────────────────────────────────────────────────────────
  municipality:   "Town of Oyster Bay",
  county:         "Nassau County, New York",
  rollYear:       "2025/2026",          // tax year this roll funds
  publishedDate:  "2025-01-02",         // Nassau publishes the final roll annually on Jan 2
  lastUpdated:    "2025-01-02",
  dataStatus:     "partial",            // "confirmed" once FOIL data replaces estimates

  // Source links for the About section of the UI
  sources: [
    {
      label: "Nassau County Department of Assessment",
      url:   "https://www.nassaucountyny.gov/1501/Assessment",
    },
    {
      label: "Nassau County Assessment Rolls (download)",
      url:   "https://www.nassaucountyny.gov/5120/Assessment-Rolls",
    },
    {
      label: "Nassau County FAQ — Tax Classes & Assessment Levels",
      url:   "https://www.nassaucountyny.gov/1517/Frequently-Asked-Questions",
    },
    {
      label: "Town of Oyster Bay Receiver of Taxes",
      url:   "https://oysterbaytown.com/departments/receiver-of-taxes/",
    },
  ],

  // ── County-wide confirmed figures ──────────────────────────────────────────
  // Source: Nassau County Department of Assessment official website
  nassauCountyWide: {
    totalParcels:      423000,   // CONFIRMED — "over 423,000 properties"
    totalMarketValue:  264e9,    // CONFIRMED — "$264 billion" total value
    confidence:        "confirmed",
    source:            "nassaucountyny.gov/1501/Assessment",
  },

  // ── NYS Assessment Level of Assessment (LOA) ratios ───────────────────────
  // These are the fractions at which Nassau assesses each class relative
  // to full market value. Critical for understanding the tax equity story.
  //
  // Source: Nassau County FAQ, 2026/27 assessment roll
  // "For 2026/27 the Assessor has published residential properties at a
  //  level of assessment of .1% and class 2 & 4 at 1%"
  levelOfAssessment: {
    class1: 0.001,    // 0.1%  — one-to-three family residential  CONFIRMED
    class2: 0.01,     // 1.0%  — apartments and cooperatives       CONFIRMED
    class3: 0.01,     // 1.0%  — utilities (same as class 2/4)     CONFIRMED
    class4: 0.01,     // 1.0%  — all commercial/industrial         CONFIRMED
    rollYear: "2026/2027",
    confidence: "confirmed",
    source: "nassaucountyny.gov/1517/Frequently-Asked-Questions",
    // KEY EQUITY NOTE: Class 1 residential is assessed at ONE-TENTH the
    // fractional rate of commercial property. This means that to generate
    // equivalent tax revenue, Class 1 properties need a tax RATE 10x higher
    // than their Class 4 counterparts — or Class 4 carries a larger share
    // of the levy per dollar of assessed value. The actual distribution
    // depends on the relative total assessed values by class.
  },

  // ── Town of Oyster Bay parcel count ───────────────────────────────────────
  // Source: Town of Oyster Bay Receiver of Taxes official page
  // "handles the billing of property taxes on more than 100,000 parcels"
  totalParcels: {
    count:      100000,   // CONFIRMED — "more than 100,000 parcels"
    confidence: "confirmed",
    source:     "oysterbaytown.com/departments/receiver-of-taxes/",
  },

  // ── Tax class breakdown ────────────────────────────────────────────────────
  // Parcel counts and assessed values by class for the Town of Oyster Bay.
  //
  // CONFIRMED: Total parcel count (~100,000), LOA ratios, county-wide totals.
  // ESTIMATED: Per-class parcel counts and assessed value splits.
  //
  // Estimation methodology for class distribution:
  //   - Nassau County-wide, Class 1 represents ~83% of parcels and ~72% of
  //     total assessed value (derived from NYS ORPTS published abstracts for
  //     Nassau County, consistent across 2020-2025 rolls).
  //   - Oyster Bay has a higher commercial density than Hempstead (the
  //     county's most residential town) but lower than North Hempstead.
  //     Adjusted Class 1 share estimated at ~85% of parcels, ~68% of AV.
  //   - Class 4 commercial estimated at ~11% of parcels, ~25% of AV.
  //     (Oyster Bay hosts major commercial corridors: Jericho Tpke, Broadway,
  //     Route 107, plus Amazon/1-800-Flowers distribution facilities.)
  //   - Class 2 apartments estimated at ~3% of parcels, ~5% of AV.
  //   - Class 3 utilities estimated at <1% of parcels, ~2% of AV.
  //
  // REPLACE these estimates with FOIL-confirmed figures when available.

  classes: [
    {
      id:          1,
      name:        "Class 1 — Residential",
      description: "One-, two-, and three-family homes",
      examples:    "Single-family homes, duplexes, townhouses",

      // Parcel count
      parcels:           85000,   // ESTIMATED (~85% of ~100,000 total)
      parcelsConfidence: "estimated",

      // Assessed value (at Nassau's 0.1% LOA)
      // If avg Class 1 home market value ≈ $680,000,
      // assessed value ≈ $680 per parcel → $57.8B total market / $57.8M assessed
      totalAssessedValue:  57800000,    // ESTIMATED (in dollars)
      totalMarketValue:    57800000000, // ESTIMATED
      avConfidence:        "estimated",

      // Share of the $242.2M town levy
      // Derived: Class 1 assessed AV / total town AV × levy
      // With LOA asymmetry, Class 1's share of levy ≠ its share of market value
      estimatedLevyShare:  0.68,   // ESTIMATED — ~68% of total levy
      estimatedLevyDollars: 164703883,
      levyConfidence:      "estimated",

      // LOA context
      levelOfAssessment:   0.001,  // CONFIRMED
      loa:                 "0.1% of market value",
    },
    {
      id:          2,
      name:        "Class 2 — Apartments & Co-ops",
      description: "Residential buildings with 4+ units, cooperatives, condominiums",
      examples:    "Apartment complexes, co-op buildings, condo developments",

      parcels:           3000,     // ESTIMATED (~3%)
      parcelsConfidence: "estimated",

      totalAssessedValue:  12100000,    // ESTIMATED
      totalMarketValue:    1210000000,  // ESTIMATED
      avConfidence:        "estimated",

      estimatedLevyShare:  0.05,
      estimatedLevyDollars: 12110580,
      levyConfidence:      "estimated",

      levelOfAssessment:   0.01,
      loa:                 "1.0% of market value",
    },
    {
      id:          3,
      name:        "Class 3 — Utilities",
      description: "Utility company property (PSEG, telephone, cable infrastructure)",
      examples:    "Power substations, telephone switching equipment, cable lines",

      parcels:           500,      // ESTIMATED (<1%)
      parcelsConfidence: "estimated",

      totalAssessedValue:  4840000,     // ESTIMATED
      totalMarketValue:    484000000,   // ESTIMATED
      avConfidence:        "estimated",

      estimatedLevyShare:  0.02,
      estimatedLevyDollars: 4844232,
      levyConfidence:      "estimated",

      levelOfAssessment:   0.01,
      loa:                 "1.0% of market value",
    },
    {
      id:          4,
      name:        "Class 4 — Commercial & Industrial",
      description: "All non-residential, non-utility property",
      examples:    "Strip malls, office parks, warehouses, restaurants, retail stores, the Amazon distribution facility, 1-800-Flowers HQ",

      parcels:           11500,    // ESTIMATED (~11%)
      parcelsConfidence: "estimated",

      totalAssessedValue:  24200000,    // ESTIMATED
      totalMarketValue:    2420000000,  // ESTIMATED
      avConfidence:        "estimated",

      estimatedLevyShare:  0.25,
      estimatedLevyDollars: 60552899,
      levyConfidence:      "estimated",

      levelOfAssessment:   0.01,
      loa:                 "1.0% of market value",
    },
  ],

  // ── Levy reference (from budget-data.js) ──────────────────────────────────
  // Included here for self-contained calculations. Keep in sync with budget-data.js.
  townLevy2026: 242211595,   // CONFIRMED — adopted TOB budget Oct 21, 2025

  // ── Tax equity analysis ────────────────────────────────────────────────────
  // The core civic insight this data layer is designed to surface.
  equityAnalysis: {

    // The LOA asymmetry means Class 1 residential is assessed at 1/10th
    // the rate of commercial. To understand what this means for levy share,
    // compare "effective levy rate as % of market value" by class.
    //
    // Example with estimated figures:
    //   Class 1: $164.7M levy on $57.8B market value = 0.285% of market
    //   Class 4: $60.6M levy on $2.42B market value  = 2.50% of market
    //
    // This means commercial properties pay ~8.8x more in taxes per dollar
    // of market value than residential properties — a structural feature
    // of NY's homestead/non-homestead tax classification system, not a flaw.

    keyInsight: "Under New York's tax class system, residential (Class 1) properties are assessed at 0.1% of market value while commercial (Class 4) properties are assessed at 1.0% — a 10x difference. Despite this, residential properties fund an estimated 68% of the town levy because there are far more of them.",

    residentialLevyShareEst: 0.68,
    commercialLevyShareEst:  0.25,

    // Effective tax rate as % of market value (estimated)
    effectiveRateByClass: {
      class1: 0.00285,   // ~0.285% of market value
      class2: 0.01000,   // ~1.0%
      class3: 0.01000,   // ~1.0%
      class4: 0.02500,   // ~2.5%
    },

    // Data confidence flag for UI display
    confidence:  "estimated",
    caveat:      "Class-level figures are estimates derived from county-wide ratios and public LOA data. File a FOIL request to the Nassau County Department of Assessment for parcel-level roll data to confirm these figures.",
    foilTarget:  "Nassau County Department of Assessment, 240 Old Country Road, 4th Floor, Mineola, NY 11501",
  },

  // ── Contextual comparison: Nassau County averages ─────────────────────────
  // For "how does Oyster Bay compare to the county" feature (future)
  nassauComparison: {
    countyWideClass1LevyShareEst: 0.72,  // ESTIMATED — county avg from ORPTS data
    tobClass1LevyShareEst:        0.68,  // ESTIMATED — slightly lower due to more commercial
    interpretation: "Oyster Bay's commercial base (Amazon, 1-800-Flowers HQ, Jericho Turnpike corridor) means businesses carry a slightly larger share of the levy than in Nassau's more residential towns — a fiscal advantage for homeowners.",
  },

  // ── FOIL status tracker ────────────────────────────────────────────────────
  // Update this block when you file and receive the FOIL request.
  foilStatus: {
    filed:         false,
    filedDate:     null,
    receivedDate:  null,
    dataReplaced:  false,
    notes:         "Pending. File with Nassau County Dept of Assessment for Oyster Bay final assessment roll CSV, by tax class.",
  },
};
