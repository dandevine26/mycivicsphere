const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY || "";

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

  const { zip } = event.queryStringParameters || {};
  if (!zip || !/^\d{5}$/.test(zip)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Please enter a valid 5-digit ZIP code." }) };
  }

  if (!CONGRESS_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: "Server is missing a Congress.gov API key. Please try again later." }) };
  }

  try {
    // Step 1: ZIP -> state (free, no key needed)
    const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!zipRes.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: "We couldn't find that ZIP code. Please double-check it and try again." }) };
    }
    const zipData = await zipRes.json();
    const state = zipData?.places?.[0]?.["state abbreviation"];
    if (!state) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: "We couldn't determine the state for that ZIP code." }) };
    }

    // Step 2: state -> current members (senators + house reps)
    const memberUrl = `https://api.congress.gov/v3/member/${state}?currentMember=true&limit=250&api_key=${CONGRESS_API_KEY}`;
    const memberRes = await fetch(memberUrl, { headers: { "Accept": "application/json" } });
    if (!memberRes.ok) {
      console.error("[get-reps] Congress.gov member list HTTP", memberRes.status);
      return { statusCode: 200, headers, body: JSON.stringify({ error: "Something went wrong looking up your representatives. Please try again." }) };
    }
    const memberData = await memberRes.json();
    const rawMembers = memberData?.members || [];

    // Step 3: fetch detail for each member in parallel (phone, website, district come from the detail endpoint)
    const detailResults = await Promise.allSettled(
      rawMembers.map((m) =>
        fetch(`https://api.congress.gov/v3/member/${m.bioguideId}?api_key=${CONGRESS_API_KEY}`, {
          headers: { "Accept": "application/json" }
        }).then((r) => (r.ok ? r.json() : null))
      )
    );

    const members = rawMembers.map((m, i) => {
      const detailWrap = detailResults[i].status === "fulfilled" ? detailResults[i].value : null;
      const detail = detailWrap?.member || null;

      const latestTerm = Array.isArray(m.terms?.item) ? m.terms.item[m.terms.item.length - 1] : null;
      const chamber = latestTerm?.chamber || "";
      const type = chamber.toLowerCase().includes("senate") ? "Senator" : "Representative";

      const partyRaw = m.partyName || detail?.partyHistory?.[0]?.partyName || "";
      const party = partyRaw.startsWith("D") ? "Democrat" : partyRaw.startsWith("R") ? "Republican" : (partyRaw || "Independent");

      const phone = detail?.addressInformation?.phoneNumber || null;
      const url = detail?.officialWebsiteUrl || m.url || null;
      const contactForm = detail?.officialWebsiteUrl ? detail.officialWebsiteUrl.replace(/\/$/, "") + "/contact" : null;

      return {
        name: m.name,
        type,
        state,
        district: type === "Representative" ? Number(m.district) : null,
        party,
        phone,
        url,
        contactForm
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify({ members, state }) };
  } catch (err) {
    console.error("[get-reps]", err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ error: "Something went wrong. Please try again." }) };
  }
};
