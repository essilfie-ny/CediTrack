import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { post, put } from '../api/client';

const ACCOUNT_TYPES = [
  { key: 'cash', name: 'Cash', icon: 'cash-stack', color: '#22c55e' },
  { key: 'bank', name: 'Bank Account', icon: 'bank', color: '#3b82f6' },
  { key: 'mobile_money', name: 'Mobile Money', icon: 'phone', color: '#fbbf24' },
  { key: 'savings', name: 'Savings Account', icon: 'piggy-bank', color: '#8b5cf6' },
];

const OnboardingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState('GHS');
  const [selectedAccounts, setSelectedAccounts] = useState(['cash', 'mobile_money']);
  const [balances, setBalances] = useState({ cash: '', bank: '', mobile_money: '', savings: '' });
  const [loading, setLoading] = useState(false);

  const toggleAccount = (key) => {
    setSelectedAccounts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Create accounts
      for (const acc of ACCOUNT_TYPES.filter(a => selectedAccounts.includes(a.key))) {
        await post('/accounts', {
          name: acc.name, type: acc.key, icon: acc.icon, color: acc.color,
          balance: Math.round((parseFloat(balances[acc.key]) || 0) * 100)
        });
      }
      // Mark onboarding complete + seed demo data
      await put('/auth/onboarding');
      navigate('/');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const canProceed = () => {
    if (step === 1) return name.length > 0;
    if (step === 3) return selectedAccounts.length > 0;
    return true;
  };

  return (
    <div className="onboarding-page">
      <div className="card onboarding-card animate-fade-scale">
        {/* Progress Dots */}
        <div className="step-indicator">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'completed' : ''}`}></div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-4">
              <span style={{fontSize:'3rem'}}>👋</span>
              <h4 className="fw-800 mt-2">Welcome to CediTrack!</h4>
              <p style={{color:'var(--text-muted)'}}>Let's get your finances organized in under a minute.</p>
            </div>
            <div className="mb-4">
              <label className="form-label">What's your name?</label>
              <input type="text" className="form-control form-control-lg" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          </div>
        )}

        {/* Step 2: Currency */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="text-center mb-4">
              <span style={{fontSize:'3rem'}}>💰</span>
              <h4 className="fw-800 mt-2">Your Currency</h4>
              <p style={{color:'var(--text-muted)'}}>Choose your default currency</p>
            </div>
            <div className="d-flex flex-column gap-3 mb-4">
              {[
                { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'EUR', name: 'Euro', symbol: '€' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
              ].map(c => {
                const isSelected = currency === c.code;
                return (
                  <div 
                    key={c.code} 
                    onClick={() => setCurrency(c.code)}
                    className="w-100 p-3 rounded-3 d-flex align-items-center justify-content-between"
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary)' : 'rgba(0, 0, 0, 0.05)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span style={{
                        fontSize: '1.3rem', 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800'
                      }}>
                        {c.symbol}
                      </span>
                      <div>
                        <div className="fw-800" style={{ fontSize: '1rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                          {c.code} - {c.name}
                        </div>
                        <small style={{ color: isSelected ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)' }}>
                          Symbol: {c.symbol}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Account Types */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="text-center mb-4">
              <span style={{fontSize:'3rem'}}>🏦</span>
              <h4 className="fw-800 mt-2">Your Accounts</h4>
              <p style={{color:'var(--text-muted)'}}>Which accounts do you use?</p>
            </div>
            <div className="d-flex flex-column gap-3 mb-4">
              {ACCOUNT_TYPES.map(acc => {
                const isSelected = selectedAccounts.includes(acc.key);
                return (
                  <div 
                    key={acc.key} 
                    onClick={() => toggleAccount(acc.key)}
                    className="w-100 p-3 rounded-3 d-flex align-items-center justify-content-between"
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary)' : 'rgba(0, 0, 0, 0.05)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="category-icon" 
                        style={{
                          background: isSelected ? 'rgba(255, 255, 255, 0.2)' : `${acc.color}22`, 
                          color: isSelected ? '#ffffff' : acc.color,
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}
                      >
                        <i className={`bi bi-${acc.icon}`}></i>
                      </div>
                      <span className="fw-800" style={{ fontSize: '1rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                        {acc.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Starting Balances */}
        {step === 4 && (
          <div className="animate-slide-up">
            <div className="text-center mb-4">
              <span style={{fontSize:'3rem'}}>💵</span>
              <h4 className="fw-800 mt-2">Starting Balances</h4>
              <p style={{color:'var(--text-muted)'}}>How much money do you currently have?</p>
            </div>
            {ACCOUNT_TYPES.filter(a => selectedAccounts.includes(a.key)).map(acc => (
              <div key={acc.key} className="mb-3">
                <label className="form-label d-flex align-items-center gap-2">
                  <i className={`bi bi-${acc.icon}`} style={{color: acc.color}}></i>{acc.name}
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{background:'var(--surface)', border:'1.5px solid var(--border)', color:'var(--text-muted)'}}>GHS</span>
                  <input type="number" className="form-control" placeholder="0.00" step="0.01" min="0" value={balances[acc.key]} onChange={e => setBalances({...balances, [acc.key]: e.target.value})} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="animate-slide-up text-center">
            <span style={{fontSize:'3rem'}}>🎉</span>
            <h4 className="fw-800 mt-2">You're All Set!</h4>
            <p style={{color:'var(--text-muted)'}}>Your fresh financial workspace is ready to go.</p>
            <div className="card p-3 text-start mb-4 no-hover" style={{background:'var(--primary-light)'}}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-check-circle text-success"></i>
                <span className="fw-600" style={{fontSize:'0.875rem'}}>{selectedAccounts.length} accounts initialized</span>
              </div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-check-circle text-success"></i>
                <span className="fw-600" style={{fontSize:'0.875rem'}}>Default income & expense categories ready</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle text-success"></i>
                <span className="fw-600" style={{fontSize:'0.875rem'}}>Clean slate for tracking real money</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="d-flex justify-content-between mt-3">
          {step > 1 ? (
            <button className="btn btn-light" onClick={() => setStep(step - 1)}>
              <i className="bi bi-arrow-left me-1"></i>Back
            </button>
          ) : <div></div>}

          {step < 5 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next<i className="bi bi-arrow-right ms-1"></i>
            </button>
          ) : (
            <button className="btn btn-primary px-4" onClick={handleFinish} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-rocket-takeoff me-2"></i>}
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
