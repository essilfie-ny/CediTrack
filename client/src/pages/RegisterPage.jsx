import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card animate-fade-scale">
        <div className="text-center mb-4">
          <div className="auth-logo justify-content-center mb-2">
            <i className="bi bi-wallet2"></i>
            CediTrack
          </div>
          <p style={{color:'var(--text-muted)', fontSize:'0.9375rem'}}>Create your free account</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3" style={{fontSize:'0.875rem', borderRadius:'var(--radius-sm)'}}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-control" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Create Account
          </button>
        </form>

        <p className="text-center mt-4 mb-0" style={{fontSize:'0.875rem', color:'var(--text-muted)'}}>
          Already have an account? <Link to="/login" style={{color:'var(--primary)', fontWeight:600, textDecoration:'none'}}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
