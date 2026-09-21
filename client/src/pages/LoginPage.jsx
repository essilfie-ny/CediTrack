import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
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
          <p style={{color:'var(--text-muted)', fontSize:'0.9375rem'}}>Track your money with ease</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3" style={{fontSize:'0.875rem', borderRadius:'var(--radius-sm)'}}>
            <i className="bi bi-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Sign In
          </button>
        </form>

        <p className="text-center mt-4 mb-0" style={{fontSize:'0.875rem', color:'var(--text-muted)'}}>
          Don't have an account? <Link to="/register" style={{color:'var(--primary)', fontWeight:600, textDecoration:'none'}}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
