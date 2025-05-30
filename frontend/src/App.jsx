import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import TourCards from './components/TourCards';
import TourPage from './pages/TourPage'; // ✅ Use generic, dynamic page

export default function App() {
  return (
    <Router basename="/tourism-analytics">
      <Routes>
        {/* ✅ Home landing page */}
        <Route path="/" element={<TourWiseLanding />} />

        {/* ✅ Dynamic route for individual tours */}
        <Route path="/tour/:slug" element={<TourPage />} />

        {/* ✅ Static route for tour cards */}
        <Route path="/tour-cards" element={<TourCards />} />
      </Routes>
    </Router>
  );
}
