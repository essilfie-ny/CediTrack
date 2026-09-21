import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-layout">
      <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={closeMobileMenu} />
      <main className="main-content">
        <Header onToggleMobileMenu={toggleMobileMenu} />
        <Outlet />
      </main>
      <BottomNav onToggleMobileMenu={toggleMobileMenu} />
    </div>
  );
};

export default MainLayout;
