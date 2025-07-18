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
import CarCards from "./components/CarCards";
import TourCardsAdmin from './components/TourCardsAdmin';
import CarCardsAdmin from './components/CarCardsAdmin';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import BookPage from './pages/BookPage';
import CartPage from './components/CartPage'; // adjust path
import BookingVoucherPage from './components/BookingVoucherPage';
import PaymentInstructionsPage from './components/PaymentInstructionsPage';





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

        <Route path="/admin/car-cards" element={<CarCardsAdmin />} />

        <Route path="/upload-history/:slug" element={<UploadHistoryImage />} />

        <Route path="/dashboard" element={<UserDashboard />} />

        <Route path="/login" element={<Login />} />

        <Route path="/BookPage" element={<BookPage />} />

        <Route path="/cart" element={<CartPage />} />

        <Route path="/voucher/:referenceId" element={<BookingVoucherPage />} />

        <Route path="/payment-instructions/:reference_id" element={<PaymentInstructionsPage />} />

      </Routes>
    </Router>
  );
}




