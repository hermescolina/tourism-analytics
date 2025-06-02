import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import TourCards from './components/TourCards';
import TourPage from './pages/TourPage'; // ✅ Use generic, dynamic page
import Hotel from './pages/Hotel'; // or './components/Hotel' if stored there


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

        <Route path="/hotel" element={<Hotel />} />
      </Routes>
    </Router>
  );
}
