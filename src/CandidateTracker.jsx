// CandidateTracker.jsx
// American Civic Power — Board Candidate Tracker
// Deployment-ready for mycivicsphere.com (Vite + React)
// Uses standard browser localStorage — no window.storage dependency

import { useState, useEffect } from "react";

const P = {
  bg: "#0A1520",
  surface: "#111E2E",
  card: "#162130",
  border: "#1E3048",
  borderHover: "#2A4A6A",
  gold: "#C9A84C",
  goldLight: "#E8C97A",
  teal: "#2A9D8F",
  tealDim: "#1A6B62",
  cream: "#EEE8D8",
  muted: "#5A7A99",
  mutedLight: "#7A9AB8",
  white: "#F4F8FC",
  red: "#E05252",
  green: "#3AB88A",
  orange: "#E07A30",
  purple: "#8A6FD8",
};

const STORAGE_KEY = "acp-board-candidates";

const SEATS = [
  { id: "legal", label: "Legal & Compliance", color: P.teal, icon: "⚖️", priority: "Critical" },
  { id: "finance", label: "Finance & Accounting", color: P.gold, icon: "📊", priority: "Critical" },
  { id: "civic", label: "Civic / Gov't Affairs", color: "#5A8FD8", icon: "🏛️", priority: "High" },
  { id: "tech", label: "Technology & Digital", color: P.purple, icon: "💻", priority: "High" },
  { id: "comms", label: "Communications", color: "#D87AA0", icon: "📣", priority: "High" },
  { id: "education", label: "Education & Academia", color: P.green, icon: "🎓", priority: "Medium" },
  { id: "fundraising", label: "Fundraising & Dev", color: "#D87A40", icon: "🤝", priority: "Medium" },
  { id: "community", label: "Community / Organizing", color: "#5AA0D8", icon: "🌱", priority: "Medium" },
];

const STAGES = [
  { id: "identified", label: "Identified", color: P.muted },
  { id: "outreach", label: "Outreach Sent", color: P.gold },
  { id: "conversation", label: "In Conversation", color: P.teal },
  { id: "committed", label: "Committed", color: P.green },
  { id: "declined", label: "Declined", color: P.red },
];

const stageColor = (id) => STAGES.find(s => s.id === id)?.color || P.muted;
const stageLabel = (id) => STAGES.find(s => s.id === id)?.label || id;
const seatLabel = (id) => SEATS.find(s => s.id === id)?.label || id;
const seatColor = (id) => SEATS.find(s => s.id === id)?.color || P.muted;
const seatIcon = (id) => SEATS.find(s => s.id === id)?.icon || "•";

const EMPTY_FORM = {
  name: "", organization: "", title: "", email: "", phone: "",
  seat: "legal", stage: "identified", notes: "", lastContact: "", source: "",
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadCandidates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCandidates(candidates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  } catch (e) {
    console.error("Could not save candidates to localStorage:", e);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ color, children, small }) {
  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}44`,
      borderRadius: 20,
      padding: small ? "1px 8px" : "3px 10px",
      fontSize: small ? 10 : 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ color: P.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: P.gold }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          background: P.surface, border: `1px solid ${P.border}`, borderRadius: 7,
          padding: "9px 12px", color: P.white, fontSize: 13, fontFamily: "inherit", outline: "none",
        }}
        onFocus={e => e.target.style.borderColor = P.gold}
        onBlur={e => e.target.style.borderColor = P.border}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ color: P.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: P.surface, border: `1px solid ${P.border}`, borderRadius: 7,
        padding: "9px 12px", color: P.white, fontSize: 13, fontFamily: "inherit",
        outline: "none", cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235A7A99' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ color: P.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        style={{
          background: P.surface, border: `1px solid ${P.border}`, borderRadius: 7,
          padding: "9px 12px", color: P.white, fontSize: 13, fontFamily: "inherit",
          outline: "none", resize: "vertical",
        }}
        onFocus={e => e.target.style.borderColor = P.gold}
        onBlur={e => e.target.style.borderColor = P.border}
      />
    </div>
  );
}

function CandidateModal({ candidate, onClose, onSave, onDelete, isNew }) {
  const [form, setForm] = useState(candidate || EMPTY_FORM);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000BB", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: P.card, border: `1px solid ${P.borderHover}`, borderRadius: 14,
        width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px #000000AA",
      }}>
        <div style={{
          padding: "22px 28px 18px", borderBottom: `1px solid ${P.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: P.card, borderRadius: "14px 14px 0 0",
        }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 18, color: P.white }}>
            {isNew ? "Add Candidate" : "Edit Candidate"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: P.muted, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Jane Smith" required />
            <Input label="Organization" value={form.organization} onChange={set("organization")} placeholder="Firm / Employer" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Title / Role" value={form.title} onChange={set("title")} placeholder="Partner, CPA, etc." />
            <Input label="Source / Referral" value={form.source} onChange={set("source")} placeholder="How you found them" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Email" value={form.email} onChange={set("email")} type="email" placeholder="jane@example.com" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="(555) 000-0000" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Select label="Board Seat" value={form.seat} onChange={set("seat")}
              options={SEATS.map(s => ({ value: s.id, label: `${s.icon} ${s.label}` }))} />
            <Select label="Stage" value={form.stage} onChange={set("stage")}
              options={STAGES.map(s => ({ value: s.id, label: s.label }))} />
          </div>
          <Input label="Last Contact Date" value={form.lastContact} onChange={set("lastContact")} type="date" />
          <Textarea label="Notes" value={form.notes} onChange={set("notes")}
            placeholder="Conversation details, connections, follow-up actions…" />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            {!isNew ? (
              <button onClick={() => { if (window.confirm("Remove this candidate?")) { onDelete(form.id); onClose(); } }}
                style={{ background: "none", border: `1px solid ${P.red}44`, color: P.red, borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Remove
              </button>
            ) : <span />}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ background: "none", border: `1px solid ${P.border}`, color: P.muted, borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={() => { if (!form.name.trim()) return alert("Name is required."); onSave(form); onClose(); }}
                style={{ background: P.gold, color: P.bg, border: "none", borderRadius: 7, padding: "8px 22px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {isNew ? "Add Candidate" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 100 }}>
      <div style={{ color, fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ color: P.mutedLight, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: P.muted, fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function CandidateTracker() {
  const [candidates, setCandidates] = useState(() => loadCandidates());
  const [modal, setModal] = useState(null);
  const [filterSeat, setFilterSeat] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [search, setSearch] = useState("");

  // Persist on every change
  useEffect(() => {
    saveCandidates(candidates);
  }, [candidates]);

  const addCandidate = (form) =>
    setCandidates(prev => [...prev, { ...form, id: Date.now().toString() }]);

  const updateCandidate = (form) =>
    setCandidates(prev => prev.map(c => c.id === form.id ? form : c));

  const deleteCandidate = (id) =>
    setCandidates(prev => prev.filter(c => c.id !== id));

  const filtered = candidates.filter(c => {
    if (filterSeat !== "all" && c.seat !== filterSeat) return false;
    if (filterStage !== "all" && c.stage !== filterStage) return false;
    if (search && !`${c.name} ${c.organization} ${c.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const committed = candidates.filter(c => c.stage === "committed").length;
  const inProgress = candidates.filter(c => ["outreach", "conversation"].includes(c.stage)).length;
  const seatsFilledIds = [...new Set(candidates.filter(c => c.stage === "committed").map(c => c.seat))];

  return (
    <div style={{ minHeight: "100vh", background: P.bg, color: P.white, fontFamily: "'Source Sans Pro', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Sans+Pro:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${P.bg}; }
        ::-webkit-scrollbar-thumb { background: ${P.border}; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        option { background: ${P.surface}; }
      `}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(160deg, ${P.surface} 0%, ${P.bg} 100%)`,
        borderBottom: `2px solid ${P.gold}`,
        padding: "30px 32px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ color: P.gold, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
            American Civic Power — Internal Tool
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, lineHeight: 1.1 }}>
              Board Candidate<br /><span style={{ color: P.goldLight }}>Tracker</span>
            </h1>
            <button onClick={() => setModal({ mode: "add", candidate: null })} style={{
              background: P.gold, color: P.bg, border: "none", borderRadius: 8,
              padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              letterSpacing: "0.05em", fontFamily: "inherit",
            }}>
              + Add Candidate
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatBox label="Total Candidates" value={candidates.length} color={P.white} />
          <StatBox label="Committed" value={committed} color={P.green} sub={`${seatsFilledIds.length} of 8 seats`} />
          <StatBox label="In Pipeline" value={inProgress} color={P.gold} sub="outreach + conversation" />
          <StatBox label="Seats Needed" value={Math.max(0, 3 - committed)} color={committed >= 3 ? P.green : P.red} sub="min. 3 to form board" />
        </div>

        {/* Seat Fill Status */}
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ color: P.mutedLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Seat Fill Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SEATS.map(s => {
              const sc = candidates.filter(c => c.seat === s.id);
              const filled = sc.some(c => c.stage === "committed");
              const pipeline = sc.some(c => ["outreach", "conversation"].includes(c.stage));
              const dotColor = filled ? P.green : pipeline ? P.gold : P.muted;
              const dot = filled ? "●" : pipeline ? "◑" : "○";
              return (
                <div key={s.id} onClick={() => setFilterSeat(filterSeat === s.id ? "all" : s.id)}
                  style={{
                    background: filterSeat === s.id ? s.color + "22" : P.surface,
                    border: `1px solid ${filterSeat === s.id ? s.color : P.border}`,
                    borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
                  }}>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
                  <span style={{ color: P.cream, fontSize: 12 }}>{s.label}</span>
                  <span style={{ color: dotColor, fontSize: 13 }}>{dot}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, color: P.muted, fontSize: 11 }}>
            <span style={{ color: P.green }}>● Committed</span>
            <span style={{ marginLeft: 12, color: P.gold }}>◑ In Pipeline</span>
            <span style={{ marginLeft: 12 }}>○ Open</span>
            <span style={{ marginLeft: 12 }}>· Click a seat to filter</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, org, title…"
            style={{
              background: P.card, border: `1px solid ${P.border}`, borderRadius: 8,
              padding: "8px 14px", color: P.white, fontSize: 13, fontFamily: "inherit",
              outline: "none", flex: "1 1 200px", minWidth: 180,
            }}
          />
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{
            background: P.card, border: `1px solid ${P.border}`, borderRadius: 8,
            padding: "8px 14px", color: filterStage === "all" ? P.muted : P.white,
            fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer",
            appearance: "none", paddingRight: 28,
          }}>
            <option value="all">All Stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {(filterSeat !== "all" || filterStage !== "all" || search) && (
            <button onClick={() => { setFilterSeat("all"); setFilterStage("all"); setSearch(""); }}
              style={{ background: "none", border: `1px solid ${P.border}`, color: P.muted, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Candidate List */}
        {filtered.length === 0 ? (
          <div style={{
            background: P.card, border: `1px dashed ${P.border}`, borderRadius: 12,
            padding: "52px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🏛️</div>
            <div style={{ color: P.mutedLight, fontSize: 15, fontWeight: 600 }}>
              {candidates.length === 0 ? "No candidates yet" : "No results match your filters"}
            </div>
            <div style={{ color: P.muted, fontSize: 13, marginTop: 6 }}>
              {candidates.length === 0 ? "Start by adding your first prospective board member." : "Try adjusting your search or filters."}
            </div>
            {candidates.length === 0 && (
              <button onClick={() => setModal({ mode: "add", candidate: null })} style={{
                marginTop: 20, background: P.gold, color: P.bg, border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Add First Candidate
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => setModal({ mode: "edit", candidate: c })}
                style={{
                  background: P.card, border: `1px solid ${P.border}`, borderRadius: 10,
                  padding: "16px 20px", cursor: "pointer", display: "flex",
                  alignItems: "center", gap: 16, transition: "border-color 0.2s, background 0.2s", flexWrap: "wrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P.borderHover; e.currentTarget.style.background = "#182838"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.background = P.card; }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: seatColor(c.seat) + "33", border: `2px solid ${seatColor(c.seat)}55`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {seatIcon(c.seat)}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ color: P.white, fontWeight: 700, fontSize: 14 }}>{c.name || "—"}</div>
                  <div style={{ color: P.muted, fontSize: 12, marginTop: 2 }}>
                    {[c.title, c.organization].filter(Boolean).join(" · ")}
                    {c.source && <span> · via {c.source}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <Badge color={seatColor(c.seat)} small>{seatIcon(c.seat)} {seatLabel(c.seat)}</Badge>
                  <Badge color={stageColor(c.stage)} small>{stageLabel(c.stage)}</Badge>
                </div>
                {c.lastContact && (
                  <div style={{ color: P.muted, fontSize: 11, flexShrink: 0, textAlign: "right" }}>
                    <div style={{ color: P.mutedLight, fontWeight: 600 }}>Last contact</div>
                    <div>{new Date(c.lastContact + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  </div>
                )}
                {c.notes && (
                  <div style={{
                    width: "100%", color: P.muted, fontSize: 12,
                    borderTop: `1px solid ${P.border}`, paddingTop: 8, marginTop: 4,
                    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                  }}>
                    📝 {c.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CandidateModal
          candidate={modal.candidate}
          isNew={modal.mode === "add"}
          onClose={() => setModal(null)}
          onSave={modal.mode === "add" ? addCandidate : updateCandidate}
          onDelete={deleteCandidate}
        />
      )}
    </div>
  );
}
