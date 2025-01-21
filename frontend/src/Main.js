import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Radar from './pages/RadarPage';
import Statistics from './pages/StatisticsPage';
import Home from './pages/HomePage';
import Projects from './pages/ProjectsPage';
import AdminDashboard from './pages/AdminPage';
const Main = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/radar" element={<Radar />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default Main;