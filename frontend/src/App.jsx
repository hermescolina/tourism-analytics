import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import TourCards from './components/TourCards';
import TourPage from './pages/TourPage'; // ✅ Use generic, dynamic page
import Hotel from './pages/Hotel'; // or './components/Hotel' if stored there
import HotelAdminDashboard from './pages/HotelAdminDashboard';
import HotelAdmin from './pages/HotelAdmin';
import TourAdmin from './pages/TourAdmin';
import UploadHistoryImage from './pages/UploadHistoryImage';

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

        <Route path="/admin/hotel" element={<HotelAdminDashboard />} />

        <Route path="/admin/hotel/:slug" element={<HotelAdmin />} />

        <Route path="/admin/tours" element={<TourAdmin />} />

        <Route path="/upload-history/:slug" element={<UploadHistoryImage />} />
      </Routes>
    </Router>
  );
}


// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import TourWiseLanding from './pages/TourWiseLanding';
// import TourCards from './components/TourCards';
// import TourPage from './pages/TourPage'; // ✅ Use generic, dynamic page
// import Hotel from './pages/Hotel'; // or './components/Hotel' if stored there
// import HotelAdmin from './pages/HotelAdmin';
// import TourAdmin from './pages/TourAdmin';
// import UploadHistoryImage from './pages/UploadHistoryImage';


// export default function App() {
//   return (
//     <Router basename="/tourism-analytics">
//       <Routes>
//         {/* ✅ Home landing page */}
//         <Route path="/" element={<TourWiseLanding />} />

//         {/* ✅ Dynamic route for individual tours */}
//         <Route path="/tour/:slug" element={<TourPage />} />

//         {/* ✅ Static route for tour cards */}
//         <Route path="/tour-cards" element={<TourCards />} />

//         <Route path="/hotel" element={<Hotel />} />

//         <Route path="/hotel-admin" element={<HotelAdmin />} />

//         <Route path="/admin/tours" element={<TourAdmin />} />

//         <Route path="/upload-history/:slug" element={<UploadHistoryImage />} />

//       </Routes>
//     </Router>
//   );
// }





