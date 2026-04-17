import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import BoardRecruitmentSuite from "./BoardRecruitmentSuite";
import CandidateTracker from "./CandidateTracker";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{
        background: "#0D1B2A",
        borderBottom: "2px solid #C9A84C",
        padding: "14px 32px",
        display: "flex",
        gap: 32,
      }}>
        <Link to="/board/recruitment" style={{ color: "#C9A84C", fontWeight: 700, textDecoration: "none", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Recruitment Suite
        </Link>
        <Link to="/board/tracker" style={{ color: "#C9A84C", fontWeight: 700, textDecoration: "none", fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Candidate Tracker
        </Link>
      </nav>
      <Routes>
        <Route path="/board/recruitment" element={<BoardRecruitmentSuite />} />
        <Route path="/board/tracker" element={<CandidateTracker />} />
        <Route path="/" element={<BoardRecruitmentSuite />} />
      </Routes>
    </BrowserRouter>
  );
}