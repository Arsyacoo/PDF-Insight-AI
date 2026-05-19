import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import AnalysisPage from "./pages/AnalysisPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import LearningPage from "./pages/LearningPage.jsx";

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-surface">
      {isLanding ? (
        <Navbar />
      ) : (
        <>
          <Sidebar />
          <Navbar compact />
        </>
      )}
      <main className={isLanding ? "pt-20" : "pt-20 pb-24 md:ml-64 md:pb-8"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analysis/:documentId?" element={<AnalysisPage />} />
          <Route path="/chat/:documentId?" element={<ChatPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  );
}
