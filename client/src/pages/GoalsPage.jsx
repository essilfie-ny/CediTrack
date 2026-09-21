import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { get, post } from '../api/client';

const GoalsPage = () => {
  const { formatAmount } = useContext(AppContext);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContribute, setShowContribute] = useState(null);
  const [contributeAmt, setContributeAmt] = useState('');
  const [form, setForm] = useState({ name: '', target_amount: '', target_date: '', icon: 'bullseye', color: '#4f46e5' });

  const fetchGoals = async () => {
    try { const { data } = await get('/savings-goals'); setGoals(data); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchGoals(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.target_amount) return;
    try {
      await post('/savings-goals', { ...form, target_amount: Math.round(parseFloat(form.target_amount) * 100) });
      setShowModal(false);
      setForm({ name: '', target_amount: '', target_date: '', icon: 'bullseye', color: '#4f46e5' });
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const handleContribute = async () => {
    if (!contributeAmt || !showContribute) return;
    try {
      await post(`/savings-goals/${showContribute}/contribute`, { amount: Math.round(parseFloat(contributeAmt) * 100) });
      setShowContribute(null);
      setContributeAmt('');
      fetchGoals();
    } catch (e) { console.error(e); }
  };

  const ICONS = ['bullseye','laptop','airplane','house','car-front','shield-check','gift','mortarboard','heart','trophy'];

  if (loading) return <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-700 mb-1">Savings Goals</h5>
          <p className="mb-0" style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>Track progress toward your financial goals</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-1"></i>New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-4 no-hover">
          <div className="empty-state">
            <i className="bi bi-bullseye empty-state-icon"></i>
            <h5>No goals yet</h5>
            <p>Set a savings goal and start building toward it.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><i className="bi bi-plus-lg me-1"></i>Create Goal</button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? Math.round(g.current_amount / g.target_amount * 100) : 0;
            const remaining = g.target_amount - g.current_amount;
            return (
              <div key={g.id} className="col-md-6 col-lg-4">
                <div className="card p-4 h-100">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="category-icon" style={{background:`${g.color || '#4f46e5'}18`, color: g.color || '#4f46e5'}}>
                      <i className={`bi bi-${g.icon || 'bullseye'}`}></i>
                    </div>
                    <div>
                      <h6 className="fw-700 mb-0">{g.name}</h6>
                      {g.target_date && <small style={{color:'var(--text-muted)'}}>{new Date(g.target_date).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</small>}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-2" style={{fontSize:'0.8125rem'}}>
                    <span className="fw-600">{formatAmount(g.current_amount)}</span>
                    <span style={{color:'var(--text-muted)'}}>{formatAmount(g.target_amount)}</span>
                  </div>
                  <div className="progress mb-2" style={{height:'10px'}}>
                    <div className="progress-bar" style={{width:`${Math.min(pct,100)}%`, backgroundColor: g.color || '#4f46e5'}}></div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{fontSize:'0.8125rem', fontWeight:600, color: pct >= 100 ? 'var(--income)' : 'var(--text-muted)'}}>
                      {pct >= 100 ? '🎉 Goal reached!' : `${pct}% · ${formatAmount(remaining)} to go`}
                    </span>
                    {pct < 100 && (
                      <button className="btn btn-sm btn-outline-primary" style={{fontSize:'0.75rem'}} onClick={() => { setShowContribute(g.id); setContributeAmt(''); }}>
                        <i className="bi bi-plus me-1"></i>Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Goal Modal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-700 mb-4">New Savings Goal</h5>
              <div className="mb-3">
                <label className="form-label">Goal Name</label>
                <input className="form-control" placeholder="e.g. New Laptop" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label">Target Amount (GHS)</label>
                <input type="number" className="form-control" placeholder="0.00" step="0.01" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} />
              </div>
              <div className="mb-3">
                <label className="form-label">Target Date (optional)</label>
                <input type="date" className="form-control" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="form-label">Icon</label>
                <div className="d-flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <div key={icon} className={`category-grid-item ${form.icon === icon ? 'selected' : ''}`} style={{padding:'0.5rem', width:'44px', height:'44px', justifyContent:'center'}} onClick={() => setForm({...form, icon})}>
                      <i className={`bi bi-${icon}`}></i>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary flex-fill" onClick={handleSave} disabled={!form.name || !form.target_amount}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContribute && (
        <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}} onClick={() => setShowContribute(null)}>
          <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-700 mb-3">Add to Goal</h5>
              <div className="mb-4">
                <label className="form-label">Amount (GHS)</label>
                <input type="number" className="form-control form-control-lg text-center fw-700" placeholder="0.00" step="0.01" value={contributeAmt} onChange={e => setContributeAmt(e.target.value)} autoFocus />
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setShowContribute(null)}>Cancel</button>
                <button className="btn btn-primary flex-fill" onClick={handleContribute} disabled={!contributeAmt}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
