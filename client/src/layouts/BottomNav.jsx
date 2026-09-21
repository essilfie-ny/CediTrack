import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const BottomNav = ({ onToggleMobileMenu }) => (
  <nav className="bottom-nav">
    <NavLink to="/" end className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
      <i className="bi bi-house"></i>
      <span>Home</span>
    </NavLink>
    <NavLink to="/transactions" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
      <i className="bi bi-receipt"></i>
      <span>History</span>
    </NavLink>

    {/* Center FAB for quick transaction */}
    <Link to="/transactions" className="bottom-nav-fab" title="Add Transaction">
      <i className="bi bi-plus-lg"></i>
    </Link>

    <NavLink to="/budgets" className={({isActive}) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
      <i className="bi bi-pie-chart"></i>
      <span>Budget</span>
    </NavLink>

    {/* More button triggers full mobile sidebar menu drawer */}
    <button type="button" className="bottom-nav-item border-0 bg-transparent" onClick={onToggleMobileMenu}>
      <i className="bi bi-grid"></i>
      <span>Menu</span>
    </button>
  </nav>
);

export default BottomNav;
