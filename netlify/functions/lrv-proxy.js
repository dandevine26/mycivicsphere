const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
/**
 * lrv-proxy.js — Nassau County LRV Tax Data Proxy
 * Netlify serverless function
 *
 * All three LRV endpoints have Access-Control-Allow-Origin: *
 * so this proxy is optional — but keeps the architecture clean
 * and protects against future CORS policy changes.
 *
 * THE COMPLETE FLOW (all endpoints are public, no auth required):
 *
 *   Step 1 — Address → Coordinates (done client-side in tax-analyzer.js):
 *     GET https://legacygis.nassaucountyny.gov/arcgis/rest/services/NassauAddressSearch/GeocodeServer/findAddressCandidates
 *     ?Street=4+Peter+Rd&City=Hicksville&Zip=11801&outFields=*&f=json
 *     → returns x,y coordinates (wkid 102718)
 *
 *   Step 2 — Coordinates → PARCEL string (done client-side in tax-analyzer.js):
 *     GET https://legacygis.nassaucountyny.gov/arcgis/rest/services/Akanda/MapServer/1/query
 *     ?geometry={"x":1114485,"y":215100,"spatialReference":{"wkid":102718}}
 *     &geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects
 *     &outFields=PARCEL&returnGeometry=false&f=json
 *     → returns {"PARCEL":"45 530 2"} (Section Block Lot)
 *
 *   Step 3 — PARCEL → Tax Data (this Netlify function):
 *     POST https://lrv.nassaucountyny.gov/gstaxes.php
 *     PARID=45530  00020&TOWN_NAME=Oyster Bay
 *     → school tax, general tax, library tax breakdown
 *
 *     POST https://lrv.nassaucountyny.gov/opentaxes.php
 *     PARID=45530  00020
 *     → open/unpaid taxes
 *
 * Query params to this function:
 *   parid     — PARCEL string from Akanda MapServer e.g. "45 530 2"
 *   town      — (optional) town name, derived from section if omitted
 */


const LRV_BASE = "https://lrv.nassaucountyny.gov";
const TOB_LEVY = { year: 2026, totalLevy: 242211595, totalBudget: 354000000 };

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const { parid, town } = event.queryStringParameters || {};

  if (!parid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing required param: parid (e.g. '45 530 2')" }),
    };
  }

  try {
    // ── Convert PARCEL string to PARID POST format ──────────────────────────
    // "45 530 2" → "45530  00020" (section+block padded, lot zero-padded to 5)
    const paridPost = parcelToParid(parid);
    const townName  = town || deriveTown(paridPost);

    console.log(`[lrv-proxy] PARCEL: "${parid}" → PARID: "${paridPost}" Town: ${townName}`);

    // ── Fetch gstaxes + opentaxes in parallel ───────────────────────────────
    const [gsResp, openResp] = await Promise.allSettled([
      lrvPost("/gstaxes.php",   { PARID: paridPost, TOWN_NAME: townName }),
      lrvPost("/opentaxes.php", { PARID: paridPost }),
    ]);

    const gsHtml   = gsResp.status   === "fulfilled" ? gsResp.value   : "";
    const openHtml = openResp.status === "fulfilled" ? openResp.value : "";

    // ── Parse ───────────────────────────────────────────────────────────────
    const taxes    = parseGsTaxes(gsHtml);
    const openTax  = parseOpenTaxes(openHtml);

    const totalTax  = (taxes.schoolTotal || 0) + (taxes.generalTotal || 0);
    const townTax   = taxes.generalTotal || 0;
    const shareOfLevy = townTax > 0
      ? +((townTax / TOB_LEVY.totalLevy) * 100).toFixed(6)
      : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source:      "Nassau County Land Records Viewer",
        retrievedAt: new Date().toISOString(),
        parid:       paridPost,
        town:        townName,
        taxes: {
          school:         taxes.schoolTax    || null,
          library:        taxes.libraryTax   || null,
          recreation:     taxes.recreationTax|| null,
          schoolTotal:    taxes.schoolTotal  || null,
          general:        taxes.generalTotal || null,
          total:          totalTax           || null,
          taxYear:        taxes.taxYear      || new Date().getFullYear(),
          breakdown:      taxes.breakdown    || [],
        },
        openTaxes: {
          hasOpenTaxes: openTax.hasOpenTaxes,
          totalOwed:    openTax.totalOwed,
        },
        analysis: {
          shareOfTobLevyPct: shareOfLevy,
          dailyCostGeneral:  townTax > 0 ? +(townTax / 365).toFixed(2) : null,
          tobLevyContext:    TOB_LEVY,
        },
      }),
    };

  } catch (err) {
    console.error("[lrv-proxy] Error:", err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: err.message, degraded: true }),
    };
  }
};

// ── PARCEL string → PARID POST format ─────────────────────────────────────────
// Akanda returns "45 530 2" (Section Block Lot, space-separated)
// gstaxes.php expects "45530  00020" — section+block no space, double-space, lot zero-padded to 5
// Pattern confirmed: 4 Peter Rd = PARCEL "45 530 2" → PARID "45530  00020"

function parcelToParid(parcel) {
  const parts = parcel.trim().split(/\s+/);
  if (parts.length < 3) throw new Error(`Invalid PARCEL format: "${parcel}"`);

  const section = parts[0].padStart(2, "0");
  const block   = parts[1].padStart(3, "0");
  const lot     = parts[2].padStart(4, "0") + (parts[3] || "0");

  // Nassau PARID format: SSSBB  LLLLL (section+block, double space, lot)
  return `${section}${block}  ${lot}`;
}

// ── Derive town from section number ───────────────────────────────────────────
function deriveTown(parid) {
  const section = parseInt(parid.trim());
  if (section >= 20 && section < 30) return "Hempstead";
  if (section >= 30 && section < 40) return "North Hempstead";
  if (section >= 40 && section < 60) return "Oyster Bay";
  if (section >= 60 && section < 70) return "Glen Cove";
  if (section >= 70 && section < 80) return "Long Beach";
  return "Oyster Bay";
}

// ── LRV POST ──────────────────────────────────────────────────────────────────
async function lrvPost(path, params) {
  const body = new URLSearchParams(params).toString();
  const resp = await fetch(LRV_BASE + path, {
    method:  "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":   "Mozilla/5.0 (compatible; CivicSphere/1.0)",
      "Referer":      LRV_BASE + "/",
      "Origin":       LRV_BASE,
    },
    body,
  });
  if (!resp.ok) throw new Error(`${path} HTTP ${resp.status}`);
  return resp.text();
}

// ── Parse gstaxes.php ─────────────────────────────────────────────────────────
function parseGsTaxes(html) {
  if (!html) return {};
  const result = { breakdown: [] };

  const yearMatch = html.match(/option value="(\d{4})" selected/);
  result.taxYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

  // Match table rows: description | taxable value | rate | dollar amount
  const rowRe = /<tr>\s*<td>\s*(?:<b>)?\s*([\w\s0-9A-Z:!&#;,.-]+?)\s*(?:<\/b>)?\s*<\/td>\s*<td>\s*([\d,]*)\s*<\/td>\s*<td>\s*([\d.]*)\s*<\/td>\s*<td>\s*\$?([\d,.-]+)\s*<\/td>\s*<\/tr>/gi;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const desc   = m[1].trim();
    const amount = parseDollar(m[4]);
    if (!desc || !amount) continue;
    result.breakdown.push({ description: desc, amount });
    const dl = desc.toLowerCase();
    if (dl.includes("net school tax"))                      result.schoolTax     = amount;
    if (dl.includes("net library"))                         result.libraryTax    = amount;
    if (dl.includes("net recreation"))                      result.recreationTax = amount;
    if (dl.includes("combined school"))                     result.schoolTotal   = amount;
    if (dl.includes("net general") || dl.includes("net town")) result.generalTotal = amount;
    if (dl.includes("combined general") || dl.includes("total general")) result.generalTotal = amount;
    if (dl.includes("total of your nassau county")) result.countyTotal = amount;
    if (dl.includes("total of your town")) result.townTotal = amount;
    if (dl.includes("total of your nassau county") || dl.includes("total of your town")) {
      result.generalTotal = (result.generalTotal || 0) + amount;
    }
  }

  if (!result.schoolTotal && result.schoolTax) {
    result.schoolTotal = (result.schoolTax || 0) + (result.libraryTax || 0) + (result.recreationTax || 0);
  }
  return result;
}

// ── Parse opentaxes.php ───────────────────────────────────────────────────────
function parseOpenTaxes(html) {
  if (!html || html.includes("No Open Taxes")) {
    return { hasOpenTaxes: false, totalOwed: 0 };
  }
  const amounts = [...html.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map(m => parseDollar(m[1]));
  const totalOwed = amounts.reduce((a, b) => a + b, 0);
  return { hasOpenTaxes: totalOwed > 0, totalOwed };
}

function parseDollar(s) {
  return parseFloat(String(s || "").replace(/[$,]/g, "")) || 0;
}
