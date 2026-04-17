// BoardRecruitmentSuite.jsx
// American Civic Power — Board Recruitment Suite
// Deployment-ready for mycivicsphere.com (Vite + React)
// No window.storage dependency — uses standard browser localStorage

import { useState } from "react";

const PALETTE = {
  navy: "#0D1B2A",
  slate: "#1C2F45",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  teal: "#2A7F7F",
  tealLight: "#3AAFAF",
  cream: "#F5F0E8",
  muted: "#8A9BB0",
  white: "#FFFFFF",
  red: "#C0392B",
  green: "#1A6B4A",
};

const skills = [
  {
    category: "Legal & Compliance",
    color: PALETTE.teal,
    icon: "⚖️",
    description: "Nonprofit law, contract review, N-PCL compliance, IRS 501(c)(3), trademark",
    priority: "Critical",
    idealBackground: "Attorney (nonprofit, municipal, or IP law)",
    boardValue: "Reduces legal costs; ensures fiduciary and regulatory compliance",
  },
  {
    category: "Finance & Accounting",
    color: PALETTE.gold,
    icon: "📊",
    description: "Budgeting, audit oversight, grant financial reporting, Form 990 review",
    priority: "Critical",
    idealBackground: "CPA, CFO, or financial officer with nonprofit experience",
    boardValue: "Required for audit committee; builds funder confidence",
  },
  {
    category: "Civic / Government Affairs",
    color: "#5B6EA8",
    icon: "🏛️",
    description: "Relationships with elected officials, municipal government, public policy advocacy",
    priority: "High",
    idealBackground: "Former elected official, chief of staff, or civic org leader",
    boardValue: "Credibility, access, and mission alignment at the core",
  },
  {
    category: "Technology & Digital",
    color: "#5B4EA8",
    icon: "💻",
    description: "Civic tech, platform development, cybersecurity, digital strategy",
    priority: "High",
    idealBackground: "Software engineer, CTO, or digital nonprofit leader",
    boardValue: "Supports CivicSphere platform; validates tech mission to funders",
  },
  {
    category: "Communications & Media",
    color: "#B84D9A",
    icon: "📣",
    description: "PR, brand strategy, social media, earned media, storytelling",
    priority: "High",
    idealBackground: "Journalist, PR strategist, or nonprofit communications director",
    boardValue: "Amplifies visibility; supports earned media and thought leadership",
  },
  {
    category: "Education & Academia",
    color: "#1A6B4A",
    icon: "🎓",
    description: "Civic education curriculum, research partnerships, university networks",
    priority: "Medium",
    idealBackground: "Professor (political science, education, public admin), school administrator",
    boardValue: "Lends academic credibility; opens partnership channels",
  },
  {
    category: "Fundraising & Development",
    color: "#C0522A",
    icon: "🤝",
    description: "Grant writing, individual donor cultivation, foundation relationships, events",
    priority: "Medium",
    idealBackground: "Development director, major gifts officer, or foundation program officer",
    boardValue: "Directly expands funding capacity",
  },
  {
    category: "Community / Organizing",
    color: "#2A6099",
    icon: "🌱",
    description: "Grassroots organizing, volunteer management, diverse community representation",
    priority: "Medium",
    idealBackground: "Labor organizer, community leader, or faith-based org director",
    boardValue: "Grounds mission in lived experience; builds community trust",
  },
];

const priorityColor = (p) => ({
  Critical: PALETTE.red,
  High: PALETTE.gold,
  Medium: PALETTE.teal,
}[p]);

function SkillCard({ skill }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: expanded ? PALETTE.slate : PALETTE.navy,
        border: `1px solid ${expanded ? skill.color : "#2A3F55"}`,
        borderRadius: 12,
        padding: "20px 22px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: expanded ? "scale(1.01)" : "scale(1)",
        boxShadow: expanded ? `0 4px 24px ${skill.color}33` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: expanded ? 14 : 0 }}>
        <span style={{ fontSize: 22 }}>{skill.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: PALETTE.white, fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700 }}>
              {skill.category}
            </span>
            <span style={{
              background: priorityColor(skill.priority) + "22",
              color: priorityColor(skill.priority),
              border: `1px solid ${priorityColor(skill.priority)}55`,
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              {skill.priority}
            </span>
          </div>
          <div style={{ color: PALETTE.muted, fontSize: 12, marginTop: 3 }}>{skill.description}</div>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${PALETTE.slate}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ color: skill.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Ideal Background</div>
            <div style={{ color: PALETTE.cream, fontSize: 13 }}>{skill.idealBackground}</div>
          </div>
          <div>
            <div style={{ color: skill.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Board Value</div>
            <div style={{ color: PALETTE.cream, fontSize: 13 }}>{skill.boardValue}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const prospectLetter = `Dear [Name],

I am reaching out because your work in [field/community] reflects a commitment to civic accountability that aligns deeply with the mission of American Civic Power.

American Civic Power is a nonprofit civic organization based in Huntington Station, NY, founded to build an informed, engaged, and empowered citizenry. Through our CivicSphere platform — a civic technology and education initiative at mycivicsphere.com — we are developing tools that make civic participation accessible and meaningful for everyday Americans.

We are forming our inaugural Board of Directors and are seeking individuals who bring [specific skill] expertise, a genuine belief in participatory democracy, and the willingness to help shape an organization from its founding.

What board service with American Civic Power offers:
• Ground-floor involvement in a civic tech and education nonprofit
• Connection to a network of organizers, technologists, and civic leaders across New York
• The opportunity to help steward a mission-driven brand at a consequential moment in civic life
• A voice in strategic decisions that shape how communities engage with their government

We ask for a modest time commitment — approximately four board meetings per year, with committee participation aligned to your expertise.

I would be honored to have a brief conversation about whether this might be a fit for you.

With respect and civic purpose,

Dan Devine
Founder, American Civic Power & CivicSphere
danielpdevine.com | mycivicsphere.com`;

const boardPacket = `AMERICAN CIVIC POWER
Board of Directors — Prospective Member Packet

──────────────────────────────────────────────

ABOUT THE ORGANIZATION

American Civic Power is a New York State nonprofit organization dedicated to building civic knowledge, capacity, and participation across communities. Our companion platform, CivicSphere (mycivicsphere.com), is a civic technology initiative providing tools for civic education, legislative tracking, and community engagement.

OUR MISSION
To empower individuals with the knowledge, tools, and connection needed to exercise their civic power — at every level of government.

OUR TAGLINE
"Civic power, put to work."

──────────────────────────────────────────────

WHAT WE'RE BUILDING

• CivicSphere Platform — Live legislative tracking and civic education tools, including AI-powered bill summaries integrated with the Congress.gov API, currently focused on New York's First Congressional District (Rep. Nick LaLota).
• 12 Points of Good Governance Framework — A structured civic education model mapping governance behaviors to community outcomes.
• CIVESTOR™ Civic Vocabulary — Coined civic engagement terms (CIVESTOR™, CIVEST™, CIVESTMENT™) anchoring a new framework for civic participation as an investment in community.

──────────────────────────────────────────────

BOARD EXPECTATIONS

Time Commitment:   4 board meetings per year (approx. 90 min each)
Committee Work:    1–2 hours/month, aligned to your expertise
Term Length:       2 years, renewable
Location:          Huntington Station, NY / Remote options available

Board Responsibilities (per NY N-PCL):
• Duty of Care — Exercise informed, good-faith judgment
• Duty of Loyalty — Prioritize organizational interests; disclose conflicts
• Duty of Obedience — Uphold mission and legal compliance

──────────────────────────────────────────────

CURRENT PRIORITY SEATS

1. Legal/Compliance (CRITICAL) — Nonprofit, IP, or municipal law background
2. Finance/Accounting (CRITICAL) — CPA or CFO with nonprofit experience
3. Civic/Government Affairs (HIGH) — Policy, elected service, or civic org leadership
4. Technology (HIGH) — Civic tech or software development background
5. Communications (HIGH) — PR, media, or nonprofit communications

──────────────────────────────────────────────

CONTACT

Dan Devine, Founder
American Civic Power | CivicSphere
danielpdevine.com
mycivicsphere.com`;

export default function BoardRecruitmentSuite() {
  const [tab, setTab] = useState("matrix");
  const [copied, setCopied] = useState(null);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: PALETTE.navy,
      fontFamily: "'Source Sans Pro', 'Helvetica Neue', sans-serif",
      color: PALETTE.white,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+Pro:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D1B2A; }
        ::-webkit-scrollbar-thumb { background: #2A3F55; border-radius: 3px; }
      `}</style>

      <div style={{
        background: `linear-gradient(135deg, ${PALETTE.slate} 0%, ${PALETTE.navy} 100%)`,
        borderBottom: `3px solid ${PALETTE.gold}`,
        padding: "36px 40px 28px",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ color: PALETTE.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
            American Civic Power
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 4vw, 40px)",
            fontWeight: 900,
            margin: 0,
            lineHeight: 1.1,
            color: PALETTE.white,
          }}>
            Board of Directors<br />
            <span style={{ color: PALETTE.goldLight }}>Recruitment Suite</span>
          </h1>
          <p style={{ color: PALETTE.muted, marginTop: 10, fontSize: 14, maxWidth: 520 }}>
            Skills matrix, recruitment letter, and prospective member packet.
          </p>
        </div>
      </div>

      <div style={{ background: PALETTE.slate, borderBottom: `1px solid #2A3F55` }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex" }}>
          {[
            { id: "matrix", label: "Skills Matrix" },
            { id: "letter", label: "Recruitment Letter" },
            { id: "packet", label: "Board Packet" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? `3px solid ${PALETTE.gold}` : "3px solid transparent",
              color: tab === t.id ? PALETTE.gold : PALETTE.muted,
              padding: "14px 24px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color 0.2s",
              fontFamily: "inherit",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 60px" }}>

        {tab === "matrix" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 22 }}>Board Skills Matrix</h2>
                <p style={{ color: PALETTE.muted, fontSize: 13, margin: "4px 0 0" }}>Click any row to expand details.</p>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                {["Critical", "High", "Medium"].map(p => (
                  <span key={p} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColor(p), display: "inline-block" }} />
                    <span style={{ color: PALETTE.muted }}>{p}</span>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {skills.map((s, i) => <SkillCard key={i} skill={s} />)}
            </div>
            <div style={{
              marginTop: 28,
              background: PALETTE.slate,
              border: `1px solid #2A3F55`,
              borderRadius: 10,
              padding: "16px 20px",
              fontSize: 13,
              color: PALETTE.muted,
            }}>
              <span style={{ color: PALETTE.gold, fontWeight: 700 }}>Note: </span>
              Per NY N-PCL, American Civic Power requires a minimum of <strong style={{ color: PALETTE.cream }}>3 independent directors</strong>. Prioritize seats 1–3 (Legal, Finance, Civic/Gov't) as your founding board.
            </div>
          </div>
        )}

        {tab === "letter" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 22 }}>Recruitment Letter</h2>
                <p style={{ color: PALETTE.muted, fontSize: 13, margin: "4px 0 0" }}>Personalize bracketed fields before sending.</p>
              </div>
              <button onClick={() => copy(prospectLetter, "letter")} style={{
                background: copied === "letter" ? PALETTE.teal : PALETTE.gold,
                color: PALETTE.navy,
                border: "none",
                borderRadius: 6,
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}>
                {copied === "letter" ? "✓ Copied!" : "Copy Text"}
              </button>
            </div>
            <div style={{
              background: PALETTE.cream,
              color: "#1A2030",
              borderRadius: 10,
              padding: "36px 40px",
              fontSize: 14,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              border: `1px solid #D4CDB8`,
            }}>
              {prospectLetter}
            </div>
          </div>
        )}

        {tab === "packet" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: 22 }}>Prospective Member Packet</h2>
                <p style={{ color: PALETTE.muted, fontSize: 13, margin: "4px 0 0" }}>Share as a PDF or plain-text document.</p>
              </div>
              <button onClick={() => copy(boardPacket, "packet")} style={{
                background: copied === "packet" ? PALETTE.teal : PALETTE.gold,
                color: PALETTE.navy,
                border: "none",
                borderRadius: 6,
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.2s",
              }}>
                {copied === "packet" ? "✓ Copied!" : "Copy Text"}
              </button>
            </div>
            <div style={{
              background: PALETTE.cream,
              color: "#1A2030",
              borderRadius: 10,
              padding: "36px 40px",
              fontSize: 14,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              border: `1px solid #D4CDB8`,
            }}>
              {boardPacket}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
