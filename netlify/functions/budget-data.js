/**
 * budget-data.js
 * Netlify serverless function — Town of Oyster Bay budget context
 *
 * Deploy to: /netlify/functions/budget-data.js
 * Endpoint:  /.netlify/functions/budget-data
 *
 * No query params. Returns static JSON representing the adopted TOB budget.
 * Update this file once per year after the Town Board adopts the new budget
 * (typically late October). Source: oysterbaytown.com/wp-content/uploads/AnnualBudget[YEAR].pdf
 *
 * No external calls, no dependencies, no API keys needed.
 */

exports.handler = async () => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    // Cache for 24 hours — this data changes once a year
    "Cache-Control": "public, max-age=86400",
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(BUDGET),
  };
};

// ── Budget data ───────────────────────────────────────────────────────────────
// Source: Town of Oyster Bay Adopted Budget 2026
// Adopted: October 21, 2025
// PDF: https://oysterbaytown.com/wp-content/uploads/AnnualBudget2026.pdf
//
// HOW TO UPDATE:
//   1. Download the new annual budget PDF from oysterbaytown.com each November.
//   2. Update `year`, `totalBudget`, `totalLevy`, `levyChangePct`, and `funds`
//      from the budget summary page (usually page 1–3 of the PDF).
//   3. Update `adoptedDate` and `sourceUrl`.
//   4. Run: netlify deploy --prod
//      (No code changes needed — just update the data object below.)

const BUDGET = {
  // ── Identity ───────────────────────────────────────────────────────────────
  year:         2026,
  adoptedDate:  "2025-10-21",
  sourceUrl:    "https://oysterbaytown.com/wp-content/uploads/AnnualBudget2026.pdf",
  supervisor:   "Joseph S. Saladino",

  // ── Top-line figures ───────────────────────────────────────────────────────
  // Total adopted budget (all funds)
  totalBudget:  354000000,

  // Property tax levy — the portion funded by homeowners
  totalLevy:    242211595,

  // Year-over-year levy change
  levyChangePct: 3.81,
  levyChangeDollars: 9224296,

  // Prior year levy (for reference / trend display)
  priorYearLevy: 232987299,
  priorYear:     2025,

  // ── Fund breakdown ─────────────────────────────────────────────────────────
  // These are the major spending funds that make up the total budget.
  // Amounts are approximate — use the PDF for audited figures.
  funds: [
    {
      name:        "General Fund",
      description: "Town administration, parks, beaches, recreation, public safety support",
      amount:      148000000,
    },
    {
      name:        "Highway Fund",
      description: "Road repaving, drainage improvements, snow removal",
      amount:      56799080,
      note:        "Increased from $50,359,077 in 2025 — primary driver of 2026 tax increase",
    },
    {
      name:        "Employee Benefits",
      description: "Health insurance, pension contributions",
      amount:      78000000,
    },
    {
      name:        "Debt Service",
      description: "Bond repayments — debt reduced by $185M since 2017",
      amount:      25000000,
    },
    {
      name:        "Special Districts",
      description: "Sanitation, lighting, parking, and other special purpose districts",
      amount:      46200920,
    },
  ],

  // ── Fiscal health context ──────────────────────────────────────────────────
  // Useful for the "about this data" section of the UI
  fiscalContext: {
    reserveFund:        242000000,   // approximate current reserves
    debtReductionSince2017: 185000000,
    creditUpgradesSince2017: 10,     // Moody's + S&P upgrades since 2017
    taxFreezeYears:     7,           // consecutive years of no increase before 2026
    taxCutYear:         2018,
    taxCutAmount:       1300000,     // $1.3M property tax cut in 2018
    avgMonthlyTaxCost:  150,         // town's stated avg homeowner monthly cost
    avgMonthlyIncrease: 6,           // increase from 2025 to 2026
  },

  // ── Per-taxpayer context ───────────────────────────────────────────────────
  // Used by tax-analyzer.js to contextualize an individual homeowner's share.
  // Estimated number of taxable parcels in the Town of Oyster Bay.
  // Source: Nassau County Assessment Roll (approximate)
  estimatedParcels: 110000,

  // Average town tax per parcel = totalLevy / estimatedParcels
  // Computed here for convenience; tax-analyzer.js can use this for
  // "you pay X% above/below the town average" comparisons.
  get avgTownTaxPerParcel() {
    return Math.round(this.totalLevy / this.estimatedParcels);
  },

  // ── Update log ─────────────────────────────────────────────────────────────
  // Keep a short history so the frontend can show trend data over time.
  history: [
    { year: 2026, levy: 242211595, budget: 354000000, changePct:  3.81 },
    { year: 2025, levy: 232987299, budget: 342846303, changePct:  0.00 },
    { year: 2024, levy: 232987299, budget: 339500000, changePct:  0.00 },
    { year: 2023, levy: 232987299, budget: 320000000, changePct:  0.00 },
    { year: 2022, levy: 232987299, budget: 311000000, changePct:  0.00 },
    { year: 2021, levy: 232987299, budget: 305000000, changePct:  0.00 },
    { year: 2020, levy: 232987299, budget: 300000000, changePct:  0.00 },
    { year: 2019, levy: 232987299, budget: 295000000, changePct:  0.00 },
    // 2018: $1.3M tax cut enacted
    { year: 2018, levy: 232987299, budget: 290000000, changePct: -0.56 },
  ],
};
