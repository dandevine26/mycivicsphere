import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import BoardRecruitmentSuite from "./BoardRecruitmentSuite";
import CandidateTracker from "./CandidateTracker";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/recruitment" element={<BoardRecruitmentSuite />} />
        <Route path="/board/tracker" element={<CandidateTracker />} />
      </Routes>
    </BrowserRouter>
  );
}