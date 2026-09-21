import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { get, post, put, del } from '../api/client';

const TransactionsPage = () => {
  const { formatAmount, accounts, categories, refreshAccounts } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [form, setForm] = useState({ 
    type: 'expense', 
    amount: '', 
    category_id: '', 
    account_id: '', 
    description: '', 
    merchant: '', 
    date: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  const fetchTransactions = async () => {
    try {
      let url = '/transactions?limit=100';
      if (filter !== 'all') url += `&type=${filter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const { data } = await get(url);
      setTransactions(data);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchTransactions(); 
  }, [filter, search]);

  const openAdd = (type = 'expense') => {
    setEditingTx(null);
    setErrorMessage('');
    const defaultAccId = accounts.length > 0 ? accounts[0].id : '';
    const filtered = categories.filter(c => c.type === type);
    const defaultCatId = filtered.length > 0 ? filtered[0].id : '';

    setForm({ 
      type, 
      amount: '', 
      category_id: defaultCatId, 
      account_id: defaultAccId, 
      description: '', 
      merchant: '', 
      date: new Date().toISOString().split('T')[0], 
      notes: '' 
    });
    setShowModal(true);
  };

  const openEdit = (tx) => {
    setEditingTx(tx);
    setErrorMessage('');
    setForm({ 
      type: tx.type, 
      amount: String(tx.amount / 100), 
      category_id: tx.category_id || '', 
      account_id: tx.account_id || (accounts[0]?.id || ''), 
      description: tx.description || '', 
      merchant: tx.merchant || '', 
      date: tx.date, 
      notes: tx.notes || '' 
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setErrorMessage('');
    const numericAmount = parseFloat(form.amount);
    
    if (!form.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      return;
    }

    let targetAccountId = form.account_id;

    // If no account exists yet, automatically create a default Cash account
    if (!targetAccountId) {
      if (accounts.length > 0) {
        targetAccountId = accounts[0].id;
      } else {
        try {
          const { data: newAcc } = await post('/accounts', { 
            name: 'Cash Account', 
            type: 'cash', 
            icon: 'cash-stack', 
            balance: 0, 
            color: '#22c55e' 
          });
          targetAccountId = newAcc.id;
          await refreshAccounts();
        } catch (_accErr) {
          setErrorMessage('Please create an account first before adding a transaction');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = { 
        ...form, 
        account_id: targetAccountId,
        amount: Math.round(numericAmount * 100) 
      };

      if (editingTx) {
        await put(`/transactions/${editingTx.id}`, payload);
      } else {
        await post('/transactions', payload);
      }

      setShowModal(false);
      refreshAccounts();
      fetchTransactions();
    } catch (e) {
      console.error('Failed to save transaction', e);
      setErrorMessage(e.response?.data?.error || 'Failed to save transaction. Please check your inputs.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await del(`/transactions/${id}`);
      setShowDelete(null);
      refreshAccounts();
      fetchTransactions();
    } catch (e) { 
      console.error(e); 
    }
  };

  // Group transactions by date
  const grouped = {};
  transactions.forEach(tx => {
    const dateKey = tx.date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  });

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredCategories = categories.filter(c => c.type === form.type);

  if (loading) {
    return <div className="spinner-wrapper"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header & Filters */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div className="btn-group">
          {['all', 'income', 'expense'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-light'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="d-flex gap-2">
          <div className="position-relative">
            <i className="bi bi-search position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem' }}></i>
            <input type="text" className="form-control form-control-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', width: '200px' }} />
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => openAdd()}>
            <i className="bi bi-plus-lg me-1"></i>Add Transaction
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card p-3 no-hover">
        {Object.keys(grouped).length === 0 ? (
          <div className="empty-state text-center py-4">
            <i className="bi bi-receipt empty-state-icon fs-1 text-muted mb-2"></i>
            <h5>No transactions found</h5>
            <p className="text-muted mb-3">Start tracking your money by adding your first transaction.</p>
            <button className="btn btn-primary" onClick={() => openAdd()}>
              <i className="bi bi-plus-lg me-1"></i>Add Transaction
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="date-header">{formatDateHeader(date)}</div>
              {txs.map(tx => (
                <div key={tx.id} className="transaction-item d-flex align-items-center justify-content-between p-2 rounded-2 mb-1 border-bottom cursor-pointer" onClick={() => openEdit(tx)}>
                  <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                    <div className="category-icon" style={{ background: tx.category_color ? `${tx.category_color}18` : '#e2e8f0', color: tx.category_color || '#64748b', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`bi bi-${tx.category_icon || 'receipt'}`}></i>
                    </div>
                    <div className="text-truncate">
                      <h6 className="mb-0 text-truncate fw-700" style={{ fontSize: '0.875rem' }}>
                        {tx.description || tx.merchant || tx.category_name || 'Transaction'}
                      </h6>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {tx.category_name || 'Uncategorized'}{tx.account_name ? ` · ${tx.account_name}` : ''}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <span className={`fw-800 ${tx.type === 'income' ? 'text-income' : 'text-expense'}`} style={{ fontSize: '0.95rem' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                    <button className="btn btn-sm btn-icon border-0 text-danger p-1" onClick={(e) => { e.stopPropagation(); setShowDelete(tx.id); }}>
                      <i className="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-800 mb-0">{editingTx ? 'Edit' : 'Add'} Transaction</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 mb-3 text-start" style={{ fontSize: '0.8125rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMessage}
                </div>
              )}

              {/* Type Toggle */}
              <div className="btn-group w-100 mb-3">
                <button 
                  className={`btn py-2 fw-700 ${form.type === 'expense' ? 'btn-danger' : 'btn-light'}`} 
                  onClick={() => {
                    const filtered = categories.filter(c => c.type === 'expense');
                    setForm({ ...form, type: 'expense', category_id: filtered[0]?.id || '' });
                  }}
                >
                  <i className="bi bi-arrow-up-right me-1"></i>Expense
                </button>
                <button 
                  className={`btn py-2 fw-700 ${form.type === 'income' ? 'btn-success' : 'btn-light'}`} 
                  onClick={() => {
                    const filtered = categories.filter(c => c.type === 'income');
                    setForm({ ...form, type: 'income', category_id: filtered[0]?.id || '' });
                  }}
                >
                  <i className="bi bi-arrow-down-left me-1"></i>Income
                </button>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="form-label fw-600">Amount (GH₵)</label>
                <input 
                  type="number" 
                  className="form-control form-control-lg text-center fw-800 text-primary" 
                  placeholder="0.00" 
                  value={form.amount} 
                  onChange={e => setForm({ ...form, amount: e.target.value })} 
                  style={{ fontSize: '1.75rem' }} 
                  step="0.01" 
                  min="0" 
                  autoFocus 
                />
              </div>

              {/* Category Dropdown Selection */}
              <div className="mb-3">
                <label className="form-label fw-600">Category</label>
                <select 
                  className="form-select" 
                  value={form.category_id} 
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">Select Category (Optional)</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Account Dropdown Selection */}
              <div className="mb-3">
                <label className="form-label fw-600">Account</label>
                <select 
                  className="form-select" 
                  value={form.account_id} 
                  onChange={e => setForm({ ...form, account_id: e.target.value })}
                >
                  {accounts.length === 0 ? (
                    <option value="">Default Cash Account (Will be created automatically)</option>
                  ) : (
                    accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                  )}
                </select>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label fw-600">Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="What was this for? (e.g. Lunch, Taxi, Salary)" 
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="form-label fw-600">Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={form.date} 
                  onChange={e => setForm({ ...form, date: e.target.value })} 
                />
              </div>

              {/* Save Transaction Button */}
              <button 
                type="button"
                className="btn btn-primary w-100 py-2.5 fw-700" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>{editingTx ? 'Update' : 'Save'} Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content p-4 text-center">
              <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
              <h6 className="fw-700 mt-3">Delete Transaction?</h6>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>This action cannot be undone.</p>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setShowDelete(null)}>Cancel</button>
                <button className="btn btn-danger flex-fill" onClick={() => handleDelete(showDelete)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
