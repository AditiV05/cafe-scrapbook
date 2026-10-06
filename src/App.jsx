import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CafeDetailsPage from "./pages/CafeDetailsPage";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe/:id" element={<CafeDetailsPage />} />
      </Routes>
    </>
  );
}
