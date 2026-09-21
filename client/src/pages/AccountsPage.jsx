import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { post, put, del } from '../api/client';

const AccountsPage = () => {
  const { formatAmount, accounts, refreshAccounts } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [adjustingAccount, setAdjustingAccount] = useState(null);
  
  const [addForm, setAddForm] = useState({ name: '', type: 'bank', balance: '', color: '#3b82f6' });
  const [editForm, setEditForm] = useState({ name: '', type: 'bank', balance: '', color: '#3b82f6' });
  const [newBalanceInput, setNewBalanceInput] = useState('');

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const TYPES = [
    { key: 'cash', icon: 'cash-stack', label: 'Cash' },
    { key: 'bank', icon: 'bank', label: 'Bank' },
    { key: 'mobile_money', icon: 'phone', label: 'Mobile Money' },
    { key: 'savings', icon: 'piggy-bank', label: 'Savings' },
    { key: 'credit_card', icon: 'credit-card', label: 'Credit Card' },
  ];
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#f97316'];

  // Create Account
  const handleCreate = async () => {
    if (!addForm.name) return;
    try {
      const typeObj = TYPES.find(t => t.key === addForm.type);
      await post('/accounts', { 
        ...addForm, 
        icon: typeObj ? typeObj.icon : 'wallet2',
        balance: Math.round((parseFloat(addForm.balance) || 0) * 100) 
      });
      setShowAddModal(false);
      setAddForm({ name: '', type: 'bank', balance: '', color: '#3b82f6' });
      refreshAccounts();
    } catch (e) { 
      console.error('Failed to create account', e); 
    }
  };

  // Open Edit Modal
  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setEditForm({
      name: acc.name,
      type: acc.type || 'bank',
      balance: (acc.balance / 100).toFixed(2),
      color: acc.color || '#3b82f6',
    });
  };

  // Update Account
  const handleUpdate = async () => {
    if (!editingAccount || !editForm.name) return;
    try {
      const typeObj = TYPES.find(t => t.key === editForm.type);
      await put(`/accounts/${editingAccount.id}`, {
        name: editForm.name,
        type: editForm.type,
        color: editForm.color,
        icon: typeObj ? typeObj.icon : 'wallet2',
        balance: Math.round((parseFloat(editForm.balance) || 0) * 100)
      });
      setEditingAccount(null);
      refreshAccounts();
    } catch (e) {
      console.error('Failed to update account', e);
    }
  };

  // Open Quick Balance Adjust Modal
  const openAdjustModal = (acc) => {
    setAdjustingAccount(acc);
    setNewBalanceInput((acc.balance / 100).toFixed(2));
  };

  // Save Direct Balance Adjustment
  const handleSaveBalanceAdjustment = async () => {
    if (!adjustingAccount) return;
    try {
      const newBalancePesewas = Math.round((parseFloat(newBalanceInput) || 0) * 100);
      await put(`/accounts/${adjustingAccount.id}`, {
        name: adjustingAccount.name,
        type: adjustingAccount.type,
        color: adjustingAccount.color,
        icon: adjustingAccount.icon,
        balance: newBalancePesewas
      });
      setAdjustingAccount(null);
      refreshAccounts();
    } catch (e) {
      console.error('Failed to adjust balance', e);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (acc) => {
    if (window.confirm(`Are you sure you want to delete "${acc.name}"?`)) {
      try {
        await del(`/accounts/${acc.id}`);
        refreshAccounts();
      } catch (e) {
        console.error('Failed to delete account', e);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-700 mb-1">Accounts</h5>
          <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage your money accounts, balances, and cash pools
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-lg me-1"></i>Add Account
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="card balance-card p-4 mb-4 no-hover" style={{ borderRadius: '16px' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="mb-1 opacity-75" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Total Available Balance</p>
          <h1 className="fs-display mb-0">{formatAmount(totalBalance)}</h1>
        </div>
      </div>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="card p-4 no-hover">
          <div className="empty-state text-center py-4">
            <i className="bi bi-wallet2 empty-state-icon fs-1 text-muted mb-2"></i>
            <h5>No accounts found</h5>
            <p className="text-muted mb-3">Add your cash, bank, or mobile money accounts to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <i className="bi bi-plus-lg me-1"></i>Add Account
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {accounts.map(acc => {
            const typeInfo = TYPES.find(t => t.key === acc.type) || TYPES[0];
            return (
              <div key={acc.id} className="col-md-6 col-lg-4">
                <div className="card p-4 h-100 position-relative">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="category-icon" style={{ background: `${acc.color || '#3b82f6'}18`, color: acc.color || '#3b82f6' }}>
                        <i className={`bi bi-${acc.icon || typeInfo.icon}`}></i>
                      </div>
                      <div>
                        <h6 className="fw-700 mb-0">{acc.name}</h6>
                        <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Action Buttons Right on the Card */}
                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-secondary btn-sm p-1 px-2"
                        title="Edit Account Details"
                        onClick={() => openEditModal(acc)}
                      >
                        <i className="bi bi-gear-fill"></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm p-1 px-2"
                        title="Delete Account"
                        onClick={() => handleDeleteAccount(acc)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Balance</span>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <h4 className="fw-800 mb-0">{formatAmount(acc.balance)}</h4>
                      <button 
                        className="btn btn-primary btn-sm rounded-pill px-3 py-1"
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        onClick={() => openAdjustModal(acc)}
                        title="Directly edit money amount"
                      >
                        <i className="bi bi-pencil me-1"></i>Adjust Balance
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-700 mb-4">Add New Account</h5>
              <div className="mb-3">
                <label className="form-label">Account Name</label>
                <input className="form-control" placeholder="e.g. Mobile Money, Ecobank Savings" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Account Type</label>
                <select className="form-select" value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })}>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Starting Balance (GH₵)</label>
                <input type="number" className="form-control" placeholder="0.00" step="0.01" value={addForm.balance} onChange={e => setAddForm({ ...addForm, balance: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="form-label">Color Theme</label>
                <div className="d-flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <div 
                      key={c} 
                      onClick={() => setAddForm({ ...addForm, color: c })} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: c, 
                        cursor: 'pointer', 
                        border: addForm.color === c ? '3px solid var(--text-main)' : '3px solid transparent' 
                      }} 
                    />
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary flex-fill" onClick={handleCreate} disabled={!addForm.name}>Create Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Balance Adjust Modal */}
      {adjustingAccount && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setAdjustingAccount(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <h5 className="fw-700 mb-1">Adjust Account Balance</h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                Directly set the amount of money in <strong>{adjustingAccount.name}</strong>.
              </p>
              
              <div className="mb-4">
                <label className="form-label fw-600">New Account Balance (GH₵)</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text">GH₵</span>
                  <input 
                    type="number" 
                    className="form-control fw-700 text-primary" 
                    step="0.01" 
                    placeholder="0.00"
                    value={newBalanceInput} 
                    onChange={e => setNewBalanceInput(e.target.value)} 
                    autoFocus
                  />
                </div>
                <small className="form-text text-muted mt-2 d-block">
                  Current recorded balance: {formatAmount(adjustingAccount.balance)}
                </small>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setAdjustingAccount(null)}>Cancel</button>
                <button className="btn btn-primary flex-fill" onClick={handleSaveBalanceAdjustment}>
                  <i className="bi bi-check-lg me-1"></i>Save New Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setEditingAccount(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-700 mb-0">Edit Account</h5>
                <button className="btn btn-outline-danger btn-sm" onClick={() => { handleDeleteAccount(editingAccount); setEditingAccount(null); }}>
                  <i className="bi bi-trash-fill me-1"></i>Delete Account
                </button>
              </div>
              <div className="mb-3">
                <label className="form-label">Account Name</label>
                <input className="form-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select className="form-select" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Balance (GH₵)</label>
                <input type="number" className="form-control" step="0.01" value={editForm.balance} onChange={e => setEditForm({ ...editForm, balance: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="form-label">Color Theme</label>
                <div className="d-flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <div 
                      key={c} 
                      onClick={() => setEditForm({ ...editForm, color: c })} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: c, 
                        cursor: 'pointer', 
                        border: editForm.color === c ? '3px solid var(--text-main)' : '3px solid transparent' 
                      }} 
                    />
                  ))}
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-light flex-fill" onClick={() => setEditingAccount(null)}>Cancel</button>
                <button className="btn btn-primary flex-fill" onClick={handleUpdate} disabled={!editForm.name}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
