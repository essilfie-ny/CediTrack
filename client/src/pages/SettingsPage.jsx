import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { AppContext, CURRENCIES } from '../context/AppContext';

const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currency, setCurrency, formatAmount } = useContext(AppContext);
  const navigate = useNavigate();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const activeCurr = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h5 className="fw-700 mb-1">Settings</h5>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage your account, currency, and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="card p-4 mb-3 no-hover">
        <h6 className="fw-700 mb-3">Profile</h6>
        <div className="d-flex align-items-center gap-3">
          <div className="user-avatar" style={{ width: 52, height: 52, fontSize: '1.25rem', borderRadius: 14 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h5 className="fw-700 mb-0">{user?.name || 'User'}</h5>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email || ''}</span>
          </div>
        </div>
      </div>

      {/* Currency Selection Card */}
      <div className="card p-4 mb-3 no-hover">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="fw-700 mb-1">Display Currency</h6>
            <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Choose currency symbol used across balances & transactions
            </p>
          </div>
          <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setShowCurrencyModal(true)}>
            <i className="bi bi-arrow-repeat me-1"></i>Change
          </button>
        </div>

        {/* Highlighted active row section with slight grey background */}
        <div 
          className="p-3 rounded-3 d-flex align-items-center justify-content-between cursor-pointer"
          style={{ 
            background: 'var(--primary-light)', 
            border: '2px solid var(--primary)',
            boxShadow: '0 4px 12px rgba(79,70,229,0.15)'
          }}
          onClick={() => setShowCurrencyModal(true)}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center fw-800 text-white" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', fontSize: '1.25rem' }}>
              {activeCurr.symbol}
            </div>
            <div>
              <h6 className="fw-800 mb-0" style={{ color: 'var(--primary)' }}>{activeCurr.name} ({activeCurr.code})</h6>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Active Format: {formatAmount(125050)}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary text-white px-2 py-1">Selected</span>
            <i className="bi bi-chevron-right text-primary fs-5"></i>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="card p-4 mb-3 no-hover">
        <h6 className="fw-700 mb-3">Appearance</h6>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-600">Dark Mode</span>
            <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Toggle between light and dark themes</p>
          </div>
          <div className="form-check form-switch" style={{ fontSize: '1.25rem' }}>
            <input className="form-check-input" type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} style={{ cursor: 'pointer', width: '3rem', height: '1.5rem' }} />
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card p-4 mb-3 no-hover">
        <h6 className="fw-700 mb-3">Data & Privacy</h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }} className="mb-3">
          All your financial data is saved safely in your local SQLite database.
        </p>
        <button className="btn btn-outline-primary btn-sm"><i className="bi bi-download me-2"></i>Export Data</button>
      </div>

      {/* Logout */}
      <div className="card p-4 no-hover mb-4">
        <button className="btn btn-danger w-100 py-2 fw-700" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left me-2"></i>Sign Out
        </button>
      </div>

      {/* Currency Selection Modal */}
      {showCurrencyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCurrencyModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-800 mb-0">Select Currency</h5>
                <button className="btn-close" onClick={() => setShowCurrencyModal(false)}></button>
              </div>
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                Tap any row to set your active display currency:
              </p>

              <div className="d-flex flex-column gap-2 mb-4">
                {CURRENCIES.map(c => {
                  const isSelected = currency === c.code;
                  return (
                    <div 
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setShowCurrencyModal(false); }}
                      className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                      style={{
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--surface-hover)', // Subtle grey background for all rows, rich highlight when selected
                        boxShadow: isSelected ? '0 4px 12px rgba(79,70,229,0.18)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="d-flex align-items-center justify-content-center fw-800"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: isSelected ? 'var(--primary)' : 'var(--border)',
                            color: isSelected ? 'white' : 'var(--text-main)',
                            fontSize: '1.25rem'
                          }}
                        >
                          {c.symbol}
                        </div>
                        <div>
                          <div className="fw-700" style={{ color: isSelected ? 'var(--primary)' : 'var(--text-main)', fontSize: '0.95rem' }}>
                            {c.name} ({c.code})
                          </div>
                          <small style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>
                            Symbol: {c.symbol}
                          </small>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white">Active</span>
                          <i className="bi bi-check-circle-fill text-primary fs-5"></i>
                        </div>
                      ) : (
                        <i className="bi bi-circle text-muted fs-6 opacity-50"></i>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="btn btn-light w-100 py-2 fw-600" onClick={() => setShowCurrencyModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
