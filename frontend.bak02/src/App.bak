import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TourWiseLanding from './pages/TourWiseLanding'; // ✅ Import restored landing page
import Dashboard from './pages/Dashboard';
import ElNido from './pages/ElNido';
import Vigan from './pages/Vigan';
import ChocolateHills from './pages/ChocolateHills';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TourWiseLanding />} />  {/* ✅ Landing page as default */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/el-nido" element={<ElNido />} />
        <Route path="/vigan" element={<Vigan />} />
        <Route path="/chocolatehills" element={<ChocolateHills />} />
      </Routes>
    </Router>
  );
}

export default App;
TourWiseLanding