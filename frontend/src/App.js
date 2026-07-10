import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';

import Home from './pages/Home';
import Supreme from './pages/Supreme';
import Machine1 from './pages/Machine1';
import Machine2 from './pages/Machine2';
import Machine3 from './pages/Machine3';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/supreme" element={<Supreme />} />
        <Route path="/machine1" element={<Machine1 />} />
        <Route path="/machine2" element={<Machine2 />} />
        <Route path="/machine3" element={<Machine3 />} />
      </Routes>
    </BrowserRouter>
  );
}
