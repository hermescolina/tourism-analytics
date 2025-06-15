import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import TourCards from './components/TourCards';
import TourPage from './pages/TourPage'; // ✅ Use generic, dynamic page
import Hotel from './pages/Hotel'; // or './components/Hotel' if stored there
import HotelAdminDashboard from './pages/HotelAdminDashboard';
import HotelAdmin from './pages/HotelAdmin';
import TourAdmin from './pages/TourAdmin';
import UploadHistoryImage from './pages/UploadHistoryImage';
import CarAdmin from './pages/CarAdmin';
import Car from './pages/Car';
import BrowseHotels from './components/HotelCards'; // Adjust the path as needed
console.log('🧠 Imported BrowseHotels:', BrowseHotels);
import CarCards from "./components/CarCards";
import TourCardsAdmin from './components/TourCardsAdmin';



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

        {/* <Route path="/hotel" element={<Hotel />} /> */}

        <Route path="/hotel/:slug" element={<Hotel />} />

        {/* ✅ Dynamic route for specific hotel admin */}

        <Route path="/hotel-cards" element={<BrowseHotels />} />

        <Route path="/admin/hotel" element={<HotelAdminDashboard />} />

        <Route path="/admin/hotel/:slug" element={<HotelAdmin />} />

        <Route path="/admin/tours" element={<TourAdmin />} />

        <Route path="/admin/tour-cards" element={<TourCardsAdmin />} />

        <Route path="/admin/car/:slug" element={<CarAdmin />} />

        <Route path="/car/:slug" element={<Car />} />

        <Route path="/car-cards" element={<CarCards />} />

        <Route path="/upload-history/:slug" element={<UploadHistoryImage />} />
      </Routes>
    </Router>
  );
}




