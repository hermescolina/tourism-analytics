import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import ElNido from './pages/ElNido';
import Vigan from './pages/Vigan';
import ChocolateHills from './pages/ChocolateHills';
import Siargao from './pages/Siargao';
import TourCards from './components/TourCards'; // ✅ NEW import

export default function App() {
  return (
    <Router basename="/tourism-analytics">
      <Routes>
        <Route path="/" element={<TourWiseLanding />} />
        <Route path="/el-nido" element={<ElNido />} />
        <Route path="/vigan" element={<Vigan />} />
        <Route path="/chocolatehills" element={<ChocolateHills />} />
        <Route path="/siargao" element={<Siargao />} />
        <Route path="/tour-cards" element={<TourCards />} /> {/* ✅ NEW route */}
      </Routes>
    </Router>
  );
}
