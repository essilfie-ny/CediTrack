import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: 'speedometer2', label: 'Dashboard' },
  { to: '/transactions', icon: 'receipt', label: 'Transactions' },
  { to: '/budgets', icon: 'pie-chart', label: 'Budgets' },
  { to: '/goals', icon: 'bullseye', label: 'Goals' },
  { to: '/accounts', icon: 'wallet2', label: 'Accounts' },
  { to: '/insights', icon: 'lightbulb', label: 'Insights' },
  { to: '/reports', icon: 'bar-chart-line', label: 'Reports' },
  { to: '/messages', icon: 'chat-left-text', label: 'Import' },
  { to: '/settings', icon: 'gear', label: 'Settings' },
];

const Sidebar = ({ mobileMenuOpen, closeMobileMenu }) => (
  <>
    {/* Backdrop for mobile drawer */}
    {mobileMenuOpen && (
      <div className="sidebar-backdrop d-md-none" onClick={closeMobileMenu}></div>
    )}

    <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-wallet2"></i>
          <span>CediTrack</span>
        </div>
        {/* Close icon button for mobile drawer */}
        <button 
          className="btn btn-sm text-muted d-md-none border-0 p-1"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <i className="bi bi-x-lg fs-5"></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink 
            key={l.to} 
            to={l.to} 
            end={l.to === '/'} 
            onClick={closeMobileMenu}
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi bi-${l.icon}`}></i>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  </>
);

export default Sidebar;
