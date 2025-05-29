import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding';
import ElNido from './pages/ElNido'; // ✅ make sure this is imported
import Vigan from './pages/Vigan';
import ChocolateHills from './pages/ChocolateHills';
import Siargao from './pages/Siargao'; // Optional if you have it

export default function App() {
  return (
    <Router basename="/tourism-analytics">
      <Routes>
        <Route path="/" element={<TourWiseLanding />} />
        <Route path="/el-nido" element={<ElNido />} />
        <Route path="/vigan" element={<Vigan />} />
        <Route path="/chocolatehills" element={<ChocolateHills />} />
        <Route path="/siargao" element={<Siargao />} />
      </Routes>
    </Router>
  );
}
