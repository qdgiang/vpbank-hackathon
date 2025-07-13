import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DemoDashboard from './pages/dashboard/DemoDashboard.jsx';
import DemoBankConnect from './pages/dashboard/DemoBankConnect.jsx';
import { BankProvider, useBank } from './contexts/BankContext';

function ProtectedRoute({ children }) {
  const { isBankConnected } = useBank();
  const location = useLocation();
  if (!isBankConnected) {
    return <Navigate to="/bank-demo" state={{ from: location }} replace />;
  }
  return children;
}

function BankGuardedBankConnect() {
  const { isBankConnected } = useBank();
  if (isBankConnected) {
    return <Navigate to="/dashboard" replace />;
  }
  return <DemoBankConnect />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DemoDashboard />
        </ProtectedRoute>
      } />
      <Route path="/bank-demo" element={<BankGuardedBankConnect />} />
    </Routes>
  );
}

function App() {
  return (
    <BankProvider>
    <Router>
        <AppRoutes />
    </Router>
    </BankProvider>
  );
}

export default App; 