import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const titles = {
  '/': 'Dashboard', '/transactions': 'Transactions', '/budgets': 'Budgets',
  '/goals': 'Goals', '/accounts': 'Accounts', '/insights': 'Insights',
  '/reports': 'Reports', '/messages': 'Import', '/settings': 'Settings',
};

const Header = ({ onToggleMobileMenu }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const title = titles[location.pathname] || 'CediTrack';

  return (
    <header className="app-header">
      <div className="d-flex align-items-center gap-2">
        {/* Mobile Hamburger Toggle */}
        <button 
          className="header-action-btn d-md-none border-0" 
          onClick={onToggleMobileMenu} 
          title="Open Menu"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
        <h4 className="mb-0">{title}</h4>
      </div>

      <div className="header-actions">
        <button className="header-action-btn" onClick={toggleTheme} title="Toggle theme">
          <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
        </button>
        <div className="user-avatar" title={user?.name || 'User'}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Header;
