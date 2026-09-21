const fs = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, 'src');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const write = (filepath, content) => {
  const fullPath = path.join(clientDir, filepath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
};

const writeRoot = (filepath, content) => {
  const fullPath = path.join(__dirname, filepath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
};

writeRoot('index.html', `
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CediTrack</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

write('index.css', `
:root {
  /* Colors */
  --bg-primary: #f8f9fc;
  --bg-secondary: #eef0f5;
  --surface: #ffffff;
  --surface-hover: #f1f3f8;
  --primary: #4f46e5;
  --primary-light: #eef2ff;
  --primary-dark: #4338ca;
  --income: #10b981;
  --income-light: #ecfdf5;
  --expense: #ef4444;
  --expense-light: #fef2f2;
  --warning: #f59e0b;
  --warning-light: #fffbeb;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --transition: all 0.2s ease;
}

[data-theme='dark'] {
  --bg-primary: #0f1117;
  --bg-secondary: #151821;
  --surface: #1a1d27;
  --surface-hover: #242836;
  --primary: #818cf8;
  --primary-light: rgba(129,140,248,0.1);
  --primary-dark: #6366f1;
  --income: #34d399;
  --income-light: rgba(52,211,153,0.1);
  --expense: #f87171;
  --expense-light: rgba(248,113,113,0.1);
  --warning: #fbbf24;
  --warning-light: rgba(251,191,36,0.1);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #2a2f3e;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

.card {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.btn-primary {
  background-color: var(--primary);
  border-color: var(--primary);
}
.btn-primary:hover {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}
.text-success { color: var(--income) !important; }
.text-danger { color: var(--expense) !important; }
.bg-success { background-color: var(--income) !important; }
.bg-danger { background-color: var(--expense) !important; }

/* Micro-animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in {
  animation: fadeIn 0.4s ease forwards;
}
`);

write('main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

write('App.jsx', `
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AccountsPage from './pages/AccountsPage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
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
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
`);

write('api/client.js', `
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3001/api'
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

client.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export default client;
`);

write('context/AuthContext.jsx', `
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem('token') ? { name: 'Demo User' } : null);
  
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`);

write('context/ThemeContext.jsx', `
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
`);

write('context/AppContext.jsx', `
import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  return (
    <AppContext.Provider value={{ accounts, setAccounts }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
`);

write('layouts/MainLayout.jsx', `
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
`);

write('layouts/MainLayout.css', `
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: 5rem;
}
@media (min-width: 768px) {
  .content-area {
    padding-bottom: 1.5rem;
  }
}
`);

write('layouts/Sidebar.jsx', `
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const links = [
    { to: '/', icon: 'bi-grid', label: 'Dashboard' },
    { to: '/transactions', icon: 'bi-receipt', label: 'Transactions' },
    { to: '/budgets', icon: 'bi-pie-chart', label: 'Budgets' },
    { to: '/goals', icon: 'bi-bullseye', label: 'Goals' },
    { to: '/accounts', icon: 'bi-wallet2', label: 'Accounts' },
    { to: '/insights', icon: 'bi-lightbulb', label: 'Insights' },
    { to: '/reports', icon: 'bi-bar-chart', label: 'Reports' },
    { to: '/messages', icon: 'bi-chat-text', label: 'Messages' },
    { to: '/settings', icon: 'bi-gear', label: 'Settings' }
  ];

  return (
    <aside className="sidebar d-none d-md-flex flex-column">
      <div className="sidebar-brand">
        <i className="bi bi-wallet2 text-primary"></i>
        <span>CediTrack</span>
      </div>
      <nav className="sidebar-nav flex-grow-1">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} className={({isActive}) => \`nav-item \${isActive ? 'active' : ''}\`}>
            <i className={\`bi \${l.icon}\`}></i> {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
`);

write('layouts/Sidebar.css', `
.sidebar {
  width: 260px;
  background-color: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1rem 0;
  transition: var(--transition);
}
.sidebar-brand {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
}
.nav-item:hover {
  background-color: var(--surface-hover);
  color: var(--primary);
}
.nav-item.active {
  background-color: var(--primary-light);
  color: var(--primary);
  border-right: 3px solid var(--primary);
}
`);

write('layouts/BottomNav.jsx', `
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="bottom-nav d-md-none">
      <NavLink to="/" className="nav-icon"><i className="bi bi-house"></i></NavLink>
      <NavLink to="/transactions" className="nav-icon"><i className="bi bi-receipt"></i></NavLink>
      <div className="nav-icon fab-container">
        <button className="fab-btn"><i className="bi bi-plus"></i></button>
      </div>
      <NavLink to="/budgets" className="nav-icon"><i className="bi bi-pie-chart"></i></NavLink>
      <NavLink to="/settings" className="nav-icon"><i className="bi bi-three-dots"></i></NavLink>
    </nav>
  );
}
`);

write('layouts/BottomNav.css', `
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background-color: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}
.nav-icon {
  color: var(--text-secondary);
  font-size: 1.25rem;
  padding: 0.5rem;
  text-decoration: none;
}
.nav-icon.active {
  color: var(--primary);
}
.fab-container {
  transform: translateY(-20px);
}
.fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  border: none;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}
`);

write('layouts/Header.jsx', `
import { useTheme } from '../context/ThemeContext';
import './Header.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="app-header">
      <h4 className="m-0 page-title">Dashboard</h4>
      <div className="header-actions">
        <button className="icon-btn"><i className="bi bi-search"></i></button>
        <button className="icon-btn" onClick={toggleTheme}>
          <i className={\`bi \${theme === 'light' ? 'bi-moon' : 'bi-sun'}\`}></i>
        </button>
        <button className="icon-btn"><i className="bi bi-bell"></i></button>
        <div className="avatar">JD</div>
      </div>
    </header>
  );
}
`);

write('layouts/Header.css', `
.app-header {
  height: 70px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}
.page-title {
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: var(--transition);
}
.icon-btn:hover {
  color: var(--primary);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
`);

write('pages/DashboardPage.jsx', `
import React from 'react';
import './DashboardPage.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardPage() {
  const data = {
    labels: ['Food', 'Transport', 'Entertainment'],
    datasets: [{
      data: [300, 50, 100],
      backgroundColor: ['#4f46e5', '#10b981', '#f59e0b'],
      borderWidth: 0
    }]
  };

  return (
    <div className="dashboard fade-in">
      <div className="balance-card">
        <div className="text-secondary">Total Balance</div>
        <h1 className="display-4 fw-bold mb-0">GHS 6,200.00</h1>
        <div className="text-success mt-2"><i className="bi bi-arrow-up"></i> 12% vs last month</div>
      </div>
      
      <div className="row g-3 mt-3">
        <div className="col-4">
          <div className="card p-3 border-0 bg-success text-white">
            <small>Income</small>
            <div className="fs-5 fw-bold">GHS 4,600.00</div>
          </div>
        </div>
        <div className="col-4">
          <div className="card p-3 border-0 bg-danger text-white">
            <small>Expenses</small>
            <div className="fs-5 fw-bold">GHS 1,850.00</div>
          </div>
        </div>
        <div className="col-4">
          <div className="card p-3 border-0 bg-primary text-white">
            <small>Savings</small>
            <div className="fs-5 fw-bold">GHS 2,750.00</div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card p-4 h-100">
            <h5 className="mb-4">Expense Breakdown</h5>
            <div style={{ height: '200px' }} className="d-flex justify-content-center">
              <Doughnut data={data} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card p-4 h-100">
            <h5 className="mb-4">Monthly Spending</h5>
            <div className="d-flex justify-content-between mb-1">
              <span>GHS 1,850.00</span>
              <span className="text-muted">GHS 3,000.00</span>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div className="progress-bar bg-warning" style={{ width: '61%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`);

write('pages/DashboardPage.css', `
.balance-card {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}
`);

const basicPage = (name) => `
import React from 'react';
export default function ${name}() {
  return <div className="fade-in p-4"><h2>${name.replace('Page', '')}</h2><p>Coming soon...</p></div>;
}
`;

write('pages/TransactionsPage.jsx', basicPage('TransactionsPage'));
write('pages/BudgetsPage.jsx', basicPage('BudgetsPage'));
write('pages/GoalsPage.jsx', basicPage('GoalsPage'));
write('pages/AccountsPage.jsx', basicPage('AccountsPage'));
write('pages/InsightsPage.jsx', basicPage('InsightsPage'));
write('pages/ReportsPage.jsx', basicPage('ReportsPage'));
write('pages/MessagesPage.jsx', basicPage('MessagesPage'));
write('pages/SettingsPage.jsx', basicPage('SettingsPage'));
write('pages/LoginPage.jsx', basicPage('LoginPage'));
write('pages/RegisterPage.jsx', basicPage('RegisterPage'));
write('pages/OnboardingPage.jsx', basicPage('OnboardingPage'));
