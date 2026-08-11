const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const PROVIDER = (process.env.ZILLOW_PROVIDER || "stub").toLowerCase();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const HOST = "us-property-data.p.rapidapi.com";

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  const { housenum, street, zip } = event.queryStringParameters || {};
  if (!housenum || !street) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing params" }) };
  const fullAddress = [housenum, street, zip].filter(Boolean).join(" ");
  try {
    const result = PROVIDER === "propertydata" ? await fetchPropertyData(fullAddress) : buildStub(fullAddress);
    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error("[zillow-proxy]", err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ zestimate: null, zpid: null, source: PROVIDER, degraded: true, error: err.message }) };
  }
};

function apiHeaders() {
  return { "Content-Type": "application/json", "X-RapidAPI-Host": HOST, "X-RapidAPI-Key": RAPIDAPI_KEY };
}

async function fetchPropertyData(address) {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY not set");
  const url = new URL("https://" + HOST + "/api/v1/search/by-location");
  url.searchParams.set("location", address);
  url.searchParams.set("sort_by", "globalrelevanceex");
  url.searchParams.set("page", "1");
  const sr = await fetch(url.toString(), { headers: apiHeaders() });
  if (!sr.ok) throw new Error("Search HTTP " + sr.status);
  const sd = await sr.json();
  const results = sd?.data || sd?.results || sd?.props || [];
  const hit = Array.isArray(results) ? results[0] : null;
  if (!hit || !hit.zpid) return { zestimate: null, zpid: null, source: "propertydata", notFound: true, searchedFor: address };
  const zpid = String(hit.zpid);
  const [zR, tR] = await Promise.allSettled([
    fetch("https://" + HOST + "/api/v1/zestimate/home-values?zpid=" + zpid, { headers: apiHeaders() }),
    fetch("https://" + HOST + "/api/v1/zestimate/tax-paid?zpid=" + zpid, { headers: apiHeaders() })
  ]);
  let zestimate = null, rentZestimate = null, taxPaid = null, taxYear = null;
  if (zR.status === "fulfilled" && zR.value.ok) {
    const z = await zR.value.json();
    const pts = z?.data?.[0]?.points; zestimate = pts ? pts[pts.length-1].y : (z?.zestimate || z?.value || null);
    rentZestimate = z?.rentZestimate || null;
  }
  if (tR.status === "fulfilled" && tR.value.ok) {
    const t = await tR.value.json();
    taxPaid = t?.taxPaid || t?.data?.taxPaid || t?.annualTax || null;
    taxYear = t?.taxYear || null;
  }
  return {
    zestimate, rentZestimate, zpid, taxPaid, taxYear,
    address: hit.address || address,
    homeType: hit.homeType || null,
    bedrooms: hit.bedrooms || null,
    bathrooms: hit.bathrooms || null,
    livingAreaSqft: hit.livingArea || null,
    yearBuilt: hit.yearBuilt || null,
    zillowUrl: "https://www.zillow.com/homedetails/" + zpid + "_zpid/",
    source: "propertydata",
    retrievedAt: new Date().toISOString()
  };
}

function buildStub(address) {
  return { zestimate: null, zpid: null, address, source: "propertydata-stub", stub: true, message: "ZILLOW_PROVIDER=propertydata set. Check RAPIDAPI_KEY.", retrievedAt: new Date().toISOString() };
}
