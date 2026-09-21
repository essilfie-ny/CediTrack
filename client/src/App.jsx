import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AccountsPage from './pages/AccountsPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
