/**
 * tax-analyzer.js
 * CivicSphere — Nassau County Property Tax Analyzer
 * Frontend merge logic
 *
 * Drop this file in your mycivicsphere site directory and reference it
 * from your tax-analyzer.html page:
 *   <script src="/js/tax-analyzer.js"></script>
 *
 * Expects this HTML structure (see tax-analyzer.html for full markup):
 *   <input id="housenum" />
 *   <input id="street" />
 *   <input id="zip" />
 *   <button id="lookup-btn">Look up</button>
 *   <div id="results" hidden>...</div>
 *   <div id="error-msg" hidden>...</div>
 *   <div id="loading" hidden>...</div>
 *
 * The three data sources:
 *   1. /.netlify/functions/lrv-proxy     — Nassau LRV (assessed value, taxes)
 *   2. /.netlify/functions/budget-data   — TOB budget context (static JSON)
 *   3. /.netlify/functions/zillow-proxy  — Zillow Zestimate (market value)
 *
 * All three are fired in parallel with Promise.allSettled so that a
 * failure in one (e.g. Zillow rate limit) doesn't block the other two.
 */

// ── Configuration ─────────────────────────────────────────────────────────────

const ENDPOINTS = {
  lrv:    "/.netlify/functions/lrv-proxy",
  budget: "/.netlify/functions/budget-data",
  zillow: "/.netlify/functions/zillow-proxy",
};

// Stub Zestimate used when Zillow proxy is unavailable or not yet wired up.
// Set to null to suppress the market value row entirely instead of showing
// a fake number.
const ZILLOW_STUB = null;

// ── DOM references (resolved once on load) ────────────────────────────────────

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  dom.housenumInput = document.getElementById("housenum");
  dom.streetInput   = document.getElementById("street");
  dom.zipInput      = document.getElementById("zip");
  dom.lookupBtn     = document.getElementById("lookup-btn");
  dom.results       = document.getElementById("results");
  dom.errorMsg      = document.getElementById("error-msg");
  dom.loading       = document.getElementById("loading");

  dom.lookupBtn.addEventListener("click", handleLookup);

  // Allow Enter key in any input field to trigger lookup
  [dom.housenumInput, dom.streetInput, dom.zipInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLookup();
    });
  });
});

// ── Main lookup handler ───────────────────────────────────────────────────────

async function handleLookup() {
  const housenum = dom.housenumInput.value.trim();
  const street   = dom.streetInput.value.trim();
  const zip      = dom.zipInput.value.trim();

  if (!housenum || !street) {
    showError("Please enter a house number and street name.");
    return;
  }

  setLoadingState(true);
  hideError();
  hideResults();

  try {
    const data = await fetchAllSources({ housenum, street, zip });
    const merged = mergeData(data);
    renderResults(merged);
    showResults();
  } catch (err) {
    console.error("[tax-analyzer] Lookup failed:", err);
    showError(
      err.userMessage ||
      "Something went wrong fetching property data. Please try again."
    );
  } finally {
    setLoadingState(false);
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

/**
 * Fire all three source requests in parallel.
 * Uses Promise.allSettled so a Zillow failure doesn't block LRV data.
 * Returns an object with lrv, budget, and zillow — each may be null on failure.
 */
async function fetchAllSources({ housenum, street, zip }) {
  const lrvUrl = buildUrl(ENDPOINTS.lrv, { housenum, street, zip });

  const [lrvResult, budgetResult, zillowResult] = await Promise.allSettled([
    fetchJson(lrvUrl),
    fetchJson(ENDPOINTS.budget),
    fetchJson(buildUrl(ENDPOINTS.zillow, { housenum, street, zip })),
  ]);

  // LRV is required — surface its error clearly
  if (lrvResult.status === "rejected" || lrvResult.value?.error) {
    const err = new Error(
      lrvResult.value?.error || lrvResult.reason?.message || "LRV lookup failed"
    );
    err.userMessage = lrvResult.value?.error === "No property found for that address."
      ? "No property found for that address. Check the house number, street name (no suffix), and ZIP."
      : "Could not retrieve Nassau County property data. Please try again shortly.";
    throw err;
  }

  return {
    lrv:    lrvResult.value,
    budget: budgetResult.status === "fulfilled" ? budgetResult.value : null,
    // Fall back to stub if Zillow is unavailable
    zillow: zillowResult.status === "fulfilled" ? zillowResult.value : { zestimate: ZILLOW_STUB },
  };
}

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

function buildUrl(base, params) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  return url.toString();
}

// ── Data merging ──────────────────────────────────────────────────────────────

/**
 * Merge the three source payloads into a single flat object
 * that the render functions work from.
 *
 * Priority: LRV is ground truth for taxes.
 * Zillow fills in market value if LRV's fullMarketValue is missing.
 * Budget fills in current-year levy context.
 */
function mergeData({ lrv, budget, zillow }) {
  const prop   = lrv.property;
  const taxes  = lrv.taxes;
  const lrvBudget = lrv.analysis?.tobLevyContext || {};

  // Market value: prefer LRV full market value, fall back to Zestimate
  const marketValue =
    (prop.fullMarketValue && prop.fullMarketValue > 0)
      ? prop.fullMarketValue
      : (zillow?.zestimate || null);

  const zestimateUsed = !prop.fullMarketValue || prop.fullMarketValue === 0;

  // Effective tax rate (taxes / market value)
  const effectiveRatePct =
    marketValue && taxes.total
      ? +((taxes.total / marketValue) * 100).toFixed(3)
      : null;

  // Budget context: prefer live budget-data.js response over LRV embedded context
  const levy       = budget?.totalLevy       || lrvBudget.totalLevy       || 242211595;
  const levyYear   = budget?.year            || lrvBudget.year            || 2026;
  const totalBudget = budget?.totalBudget    || lrvBudget.totalBudget     || 354000000;
  const levyChange  = budget?.levyChangePct  || null;

  // Share of town levy
  const shareOfLevyPct =
    taxes.town && levy
      ? +((taxes.town / levy) * 100).toFixed(6)
      : null;

  // Daily cost to the town
  const dailyCostTown = taxes.town
    ? +(taxes.town / 365).toFixed(2)
    : null;

  // Tax breakdown as percentages of total (for bar chart rendering)
  const breakdown = computeBreakdown(taxes);

  return {
    // Property identity
    address:         prop.address,
    sbl:             prop.sbl,
    schoolDistrict:  prop.schoolDistrict,
    fireDistrict:    prop.fireDistrict,
    exemptions:      prop.exemptions || [],

    // Valuation
    assessedValue:   prop.assessedValue,
    marketValue,
    zestimateUsed,   // true = market value came from Zillow, false = LRV full market

    // Taxes
    taxes,
    breakdown,

    // Analysis
    effectiveRatePct,
    shareOfLevyPct,
    dailyCostTown,

    // Budget context
    levyYear,
    levy,
    totalBudget,
    levyChange,

    // Meta
    taxYear:      lrv.taxes.taxYear,
    retrievedAt:  lrv.retrievedAt,
  };
}

/**
 * Compute each tax bucket as a % of total,
 * for proportional bar chart rendering.
 */
function computeBreakdown(taxes) {
  const total = taxes.total || 1; // avoid divide-by-zero
  return [
    {
      label:   "School district",
      amount:  taxes.school,
      pct:     +((taxes.school / total) * 100).toFixed(1),
      color:   "#378ADD",
    },
    {
      label:   "Town of Oyster Bay",
      amount:  taxes.town,
      pct:     +((taxes.town / total) * 100).toFixed(1),
      color:   "#1D9E75",
    },
    {
      label:   "Nassau County",
      amount:  taxes.county,
      pct:     +((taxes.county / total) * 100).toFixed(1),
      color:   "#7F77DD",
    },
    {
      label:   "Special districts",
      amount:  taxes.specialDistricts,
      pct:     +((taxes.specialDistricts / total) * 100).toFixed(1),
      color:   "#EF9F27",
    },
  ].filter((row) => row.amount > 0); // hide $0 rows
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderResults(d) {
  // ── Property summary ────────────────────────────────────────────────────
  setText("result-address",     d.address);
  setText("result-sbl",         d.sbl     ? `SBL: ${d.sbl}`     : "");
  setText("result-school",      d.schoolDistrict || "—");
  setText("result-fire",        d.fireDistrict   || "—");

  // ── Metric cards ────────────────────────────────────────────────────────
  setText("result-assessed",    d.assessedValue
    ? formatDollar(d.assessedValue)
    : "—");

  if (d.marketValue) {
    setText("result-market",    formatDollar(d.marketValue));
    setText("result-market-label",
      d.zestimateUsed ? "Zillow Zestimate" : "Full market value (LRV)");
  } else {
    setText("result-market",    "—");
    setText("result-market-label", "Market value");
  }

  setText("result-total-tax",   d.taxes.total ? formatDollar(d.taxes.total) : "—");
  setText("result-tax-year",    d.taxYear     ? `${d.taxYear} tax year`      : "");

  setText("result-effective-rate",
    d.effectiveRatePct !== null ? `${d.effectiveRatePct}%` : "—");

  // ── Exemptions ──────────────────────────────────────────────────────────
  renderExemptions(d.exemptions);

  // ── Tax breakdown bars ──────────────────────────────────────────────────
  renderBreakdown(d.breakdown);

  // ── Town budget context ─────────────────────────────────────────────────
  setText("result-town-tax",    d.taxes.town    ? formatDollar(d.taxes.town)    : "—");
  setText("result-levy",        d.levy          ? formatDollar(d.levy, true)    : "—");
  setText("result-levy-year",   d.levyYear      ? `${d.levyYear} budget`        : "");
  setText("result-share",       d.shareOfLevyPct !== null
    ? `${d.shareOfLevyPct.toFixed(5)}%`
    : "—");
  setText("result-daily",       d.dailyCostTown ? `$${d.dailyCostTown}/day`     : "—");

  if (d.levyChange !== null) {
    setText("result-levy-change", `+${d.levyChange}% vs prior year`);
  }

  // ── Retrieved timestamp ─────────────────────────────────────────────────
  if (d.retrievedAt) {
    const ts = new Date(d.retrievedAt).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
    setText("result-retrieved", `Data retrieved ${ts}`);
  }
}

function renderExemptions(exemptions) {
  const container = document.getElementById("result-exemptions");
  if (!container) return;

  if (!exemptions || exemptions.length === 0) {
    container.textContent = "None on record";
    return;
  }

  container.innerHTML = exemptions
    .map(
      (ex) =>
        `<span class="exemption-badge">${ex.type}: ${formatDollar(ex.amount)}</span>`
    )
    .join(" ");
}

function renderBreakdown(breakdown) {
  const container = document.getElementById("result-breakdown");
  if (!container) return;

  container.innerHTML = breakdown
    .map(
      (row) => `
      <div class="breakdown-row">
        <span class="breakdown-label">${row.label}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${row.pct}%; background:${row.color};"></div>
        </div>
        <span class="breakdown-amount">${formatDollar(row.amount)}</span>
        <span class="breakdown-pct">${row.pct}%</span>
      </div>`
    )
    .join("");
}

// ── UI state helpers ──────────────────────────────────────────────────────────

function setLoadingState(on) {
  if (dom.loading)  dom.loading.hidden  = !on;
  if (dom.lookupBtn) {
    dom.lookupBtn.disabled    = on;
    dom.lookupBtn.textContent = on ? "Looking up…" : "Look up";
  }
}

function showResults()  { if (dom.results)  dom.results.hidden  = false; }
function hideResults()  { if (dom.results)  dom.results.hidden  = true;  }
function hideError()    { if (dom.errorMsg) dom.errorMsg.hidden  = true;  }

function showError(msg) {
  if (dom.errorMsg) {
    dom.errorMsg.textContent = msg;
    dom.errorMsg.hidden = false;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Format a number as US dollars.
 * compact = true  →  "$242.2M"  (for large levy figures)
 * compact = false →  "$16,240"  (for property-level figures)
 */
function formatDollar(amount, compact = false) {
  if (amount === null || amount === undefined) return "—";
  if (compact && amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
