
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Record from './pages/Record';
import Records from './pages/Records';
import Vouchers from './pages/Vouchers';
import Statements from './pages/Statements';
import TrialBalance from './pages/TrialBalance';
import Assets from './pages/Assets';
import Closing from './pages/Closing';
import AuditCheck from './pages/AuditCheck';
import AuditLogPage from './pages/AuditLog';
import AIAdvisor from './pages/AIAdvisor';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { User } from './types';
import { CURRENT_USER } from './services/mockData';
import { useFinanceData } from './services/storage';

const App = () => {
  useFinanceData(); // Initialize Theme and Data Listeners
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = () => {
    setUser(CURRENT_USER);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Core Input */}
          <Route path="record" element={<Record />} />
          <Route path="assets" element={<Assets />} />
          
          {/* Automated Outputs (Accountant View) */}
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="records" element={<Records />} />
          <Route path="statements" element={<Statements />} />
          <Route path="trial-balance" element={<TrialBalance />} />
          <Route path="closing" element={<Closing />} />

          {/* Automated Outputs (Auditor View) */}
          <Route path="audit-check" element={<AuditCheck />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="ai" element={<AIAdvisor />} />
          
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
