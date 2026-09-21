import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { get, post, del } from '../api/client';

const BudgetsPage = () => {
  const { formatAmount, categories } = useContext(AppContext);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({ name: '', period: 'monthly', amount: '', category_id: '' });

  const fetchBudgets = async () => {
    try {
      const { data } = await get('/budgets');
      setBudgets(data);
    } catch (e) { 
      console.error('Failed to fetch budgets', e); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchBudgets(); 
  }, []);

  const openCreateModal = () => {
    setErrorMessage('');
    setForm({ name: '', period: 'monthly', amount: '', category_id: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setErrorMessage('');
    const numericAmount = parseFloat(form.amount);

    if (!form.name.trim()) {
      setErrorMessage('Please enter a budget name');
      return;
    }

    if (!form.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      await post('/budgets', {
        name: form.name.trim(),
        period: form.period,
        amount: Math.round(numericAmount * 100),
        start_date: startDate,
        end_date: null,
        categories: form.category_id ? [{ category_id: form.category_id, amount: Math.round(numericAmount * 100) }] : []
      });

      setShowModal(false);
      setForm({ name: '', period: 'monthly', amount: '', category_id: '' });
      fetchBudgets();
    } catch (e) { 
      console.error('Failed to create budget', e); 
      setErrorMessage(e.response?.data?.error || 'Failed to create budget. Please check your inputs.');
    }
    setSaving(false);
  };

  const deleteBudget = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete budget "${name}"?`)) {
      try { 
        await del(`/budgets/${id}`); 
        fetchBudgets(); 
      } catch (e) { 
        console.error('Failed to delete budget', e); 
      }
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  if (loading) return <div className="spinner-wrapper"><div className="spinner-border text-primary" role="status"></div></div>;

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-700 mb-1">Budgets</h5>
          <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Control your spending with budget limits
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-1"></i>New Budget
        </button>
      </div>

      {/* Overview Card */}
      {budgets.length > 0 && (
        <div className="card p-4 mb-4 no-hover" style={{ borderRadius: '16px' }}>
          <div className="row text-center">
            <div className="col-4">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }} className="mb-1">TOTAL BUDGET</p>
              <h5 className="fw-800 mb-0">{formatAmount(totalBudget)}</h5>
            </div>
            <div className="col-4">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }} className="mb-1">SPENT</p>
              <h5 className="fw-800 text-expense mb-0">{formatAmount(totalSpent)}</h5>
            </div>
            <div className="col-4">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }} className="mb-1">REMAINING</p>
              <h5 className={`fw-800 mb-0 ${totalBudget - totalSpent >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatAmount(totalBudget - totalSpent)}
              </h5>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="card p-4 no-hover">
          <div className="empty-state text-center py-4">
            <i className="bi bi-pie-chart empty-state-icon fs-1 text-muted mb-2"></i>
            <h5>No budgets created yet</h5>
            <p className="text-muted mb-3">Create your first budget to start controlling your monthly spending.</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <i className="bi bi-plus-lg me-1"></i>Create Budget
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {budgets.map(b => {
            const pct = b.amount > 0 ? Math.round((b.spent || 0) / b.amount * 100) : 0;
            const color = pct > 90 ? 'var(--expense)' : pct > 70 ? 'var(--warning)' : 'var(--income)';
            const remaining = b.amount - (b.spent || 0);
            return (
              <div key={b.id} className="col-md-6">
                <div className="card p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h6 className="fw-800 mb-0">{b.name}</h6>
                    <button className="btn btn-sm btn-icon border-0 text-danger p-0" title="Delete Budget" onClick={() => deleteBudget(b.id, b.name)}>
                      <i className="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.875rem' }}>
                    <span>Spent: <strong className="text-expense">{formatAmount(b.spent || 0)}</strong></span>
                    <span>Limit: <strong>{formatAmount(b.amount)}</strong></span>
                  </div>
                  <div className="progress mb-2" style={{ height: '10px' }}>
                    <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}></div>
                  </div>
                  <p className="mb-0" style={{ fontSize: '0.8125rem', color, fontWeight: 600 }}>
                    {remaining >= 0 ? `${formatAmount(remaining)} remaining` : `Over budget by ${formatAmount(Math.abs(remaining))}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Budget Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-800 mb-0">Create Budget</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 mb-3 text-start" style={{ fontSize: '0.8125rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-600">Budget Name</label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Food & Groceries, Transport" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-600">Category (Optional)</label>
                <select 
                  className="form-select" 
                  value={form.category_id} 
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">All Categories (General Limit)</option>
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-600">Budget Limit (GH₵)</label>
                <input 
                  type="number" 
                  className="form-control form-control-lg text-center fw-800 text-primary" 
                  placeholder="0.00" 
                  step="0.01" 
                  min="0"
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-600">Period</label>
                <select 
                  className="form-select" 
                  value={form.period} 
                  onChange={e => setForm({ ...form, period: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill py-2" onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                  className="btn btn-primary flex-fill py-2 fw-700" 
                  onClick={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>Creating...
                    </>
                  ) : (
                    'Create Budget'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
