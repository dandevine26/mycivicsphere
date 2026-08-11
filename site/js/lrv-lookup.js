/**
 * lrv-lookup.js
 * Browser-side address → PARID lookup using Nassau County GIS
 * Called by tax-analyzer.js before hitting the Netlify lrv-proxy function.
 *
 * Flow:
 *   1. Geocode address → coordinates (GeoServer, public, CORS *)
 *   2. Coordinates → PARCEL field  (Akanda MapServer, public, CORS *)
 *   3. PARCEL → tax data           (/.netlify/functions/lrv-proxy, our function)
 *
 * All three GIS endpoints return Access-Control-Allow-Origin: *
 * so they can be called directly from the browser.
 */

const GIS_BASE    = "https://legacygis.nassaucountyny.gov/arcgis/rest/services";
const GEOCODE_URL = `${GIS_BASE}/NassauAddressSearch/GeocodeServer/findAddressCandidates`;
const PARCEL_URL  = `${GIS_BASE}/Akanda/MapServer/1/query`;

/**
 * Full address → tax data pipeline.
 * Returns the lrv-proxy JSON response or throws on failure.
 */
async function lookupTaxData(housenum, street, zip) {

  // ── Step 1: Geocode ─────────────────────────────────────────────────────────
  const geoParams = new URLSearchParams({
    Street:    `${housenum} ${street}`,
    Zip:       zip,
    outFields: "*",
    f:         "json",
  });

  const geoResp = await fetch(`${GEOCODE_URL}?${geoParams}`);
  if (!geoResp.ok) throw new Error(`Geocoder HTTP ${geoResp.status}`);
  const geoData = await geoResp.json();

  const candidates = geoData?.candidates || [];
  // Take the highest-score candidate with score >= 80
  const best = candidates.find(c => c.score >= 80);
  if (!best) {
    throw new Error("Address not found in Nassau County. Check the address and try again.");
  }

  const { x, y } = best.location;
  const matchedAddress = best.address;

  // ── Step 2: Coordinates → PARCEL ───────────────────────────────────────────
  const parcelParams = new URLSearchParams({
    geometry:     JSON.stringify({ x, y, spatialReference: { wkid: 102718 } }),
    geometryType: "esriGeometryPoint",
    spatialRel:   "esriSpatialRelIntersects",
    outFields:    "PARCEL",
    returnGeometry: "false",
    f:            "json",
  });

  const parcelResp = await fetch(`${PARCEL_URL}?${parcelParams}`);
  if (!parcelResp.ok) throw new Error(`Parcel lookup HTTP ${parcelResp.status}`);
  const parcelData = await parcelResp.json();

  const parcelStr = parcelData?.features?.[0]?.attributes?.PARCEL;
  if (!parcelStr) {
    throw new Error("No parcel found at that location. The address may be outside Nassau County.");
  }

  // ── Step 3: PARCEL → Tax data via Netlify function ─────────────────────────
  const taxParams = new URLSearchParams({ parid: parcelStr });
  const taxResp   = await fetch(`/.netlify/functions/lrv-proxy?${taxParams}`);
  if (!taxResp.ok) throw new Error(`Tax lookup HTTP ${taxResp.status}`);
  const taxData = await taxResp.json();

  // Augment with address from geocoder
  if (taxData.property) {
    taxData.property.address       = matchedAddress;
    taxData.property.geocodeScore  = best.score;
    taxData.property.coordinates   = { x, y };
  }

  return taxData;
}

// Export for use in tax-analyzer.js
if (typeof module !== "undefined") module.exports = { lookupTaxData };
