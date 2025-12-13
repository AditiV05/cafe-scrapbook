import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CafeDetailsPage from "./pages/CafeDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cafe/:id" element={<CafeDetailsPage />} />
    </Routes>
  );
}
