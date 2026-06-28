import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CafeDetailsPage from "./pages/CafeDetailsPage";
import ScrollToTop from "./components/ScrollToTop"; // ← is this import here?

export default function App() {
  return (
    <>
      <ScrollToTop /> {/* ← is this line here? */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe/:id" element={<CafeDetailsPage />} />
      </Routes>
    </>
  );
}
