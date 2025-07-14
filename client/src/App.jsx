import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DemoDashboard from './pages/dashboard/DemoDashboard.jsx';
import Login from './pages/auth/Login.jsx';
import { useSelector } from 'react-redux';

function AppRoutes() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/dashboard" element={
        isAuthenticated ? <DemoDashboard /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>   
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App; 