import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { post } from '../api/client';

const EXAMPLES = [
  'You have received GHS 500.00 from JOHN DOE. Your MoMo balance is GHS 1,234.56.',
  'Cash out GHS 200.00 to Agent. Fee: GHS 1.00. Balance: GHS 799.00.',
  'Your account has been credited with GHS 4,000.00. Available balance: GHS 12,500.00',
  'You sent GHS 150.00 to Kwame. Transaction ID: 123456789.',
  'Transfer of GHS 300.00 to 0244xxxxxxx successful.',
];

const MessagesPage = () => {
  const { formatAmount, accounts, categories, refreshAccounts } = useContext(AppContext);
  const [message, setMessage] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleParse = async () => {
    if (!message.trim()) return;
    setError('');
    setSuccessMsg('');
    setParsing(true);
    setParsed(null);
    try {
      const { data } = await post('/messages/parse', { message: message.trim() });
      if (data && data.parsed) {
        setParsed({ id: data.id, ...data.parsed });
      } else {
        setError('Could not auto-detect transaction from this message.');
      }
    } catch (e) {
      setError('Could not parse this message. Try a different format.');
    }
    setParsing(false);
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    setError('');
    try {
      let targetAccId = accounts.length > 0 ? accounts[0].id : null;
      if (!targetAccId) {
        const { data: newAcc } = await post('/accounts', { name: 'Cash Account', type: 'cash', balance: 0 });
        targetAccId = newAcc.id;
      }
      const matchingCat = categories.find(c => c.type === parsed.type);
      await post('/messages/confirm', {
        message_id: parsed.id,
        transaction_data: {
          account_id: targetAccId,
          category_id: matchingCat ? matchingCat.id : null,
          type: parsed.type,
          amount: parsed.amount,
          description: `${parsed.provider || 'SMS'} Import`,
          date: new Date().toISOString().split('T')[0]
        }
      });
      await refreshAccounts();
      setSuccessMsg('Transaction created and saved successfully!');
      setParsed(null);
      setMessage('');
    } catch (e) {
      console.error(e);
      setError('Failed to confirm and save transaction. Please try again.');
    }
    setSaving(false);
  };

  const confidenceColor = (c) => c >= 0.8 ? 'var(--income)' : c >= 0.5 ? 'var(--warning)' : 'var(--expense)';
  const confidenceLabel = (c) => c >= 0.8 ? 'High' : c >= 0.5 ? 'Medium' : 'Low';

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h5 className="fw-700 mb-1">Import Messages</h5>
        <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>Paste transaction SMS or notifications to auto-detect transactions</p>
      </div>

      {/* Input */}
      <div className="card p-4 mb-4 no-hover">
        <label className="form-label">Transaction Message</label>
        <textarea className="form-control mb-3" rows={4} placeholder="Paste your MoMo, bank, or payment SMS here..." value={message} onChange={e => setMessage(e.target.value)} style={{resize:'vertical'}} />
        <button className="btn btn-primary" onClick={handleParse} disabled={parsing || !message.trim()}>
          {parsing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-magic me-2"></i>}
          Parse Message
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="alert alert-success py-2 px-3 mb-4" style={{borderRadius:'var(--radius-sm)', fontSize:'0.875rem'}}>
          <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4" style={{borderRadius:'var(--radius-sm)', fontSize:'0.875rem'}}>
          <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
        </div>
      )}

      {/* Parsed Result */}
      {parsed && (
        <div className="card p-4 mb-4 no-hover animate-slide-up">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-700 mb-0">Detected Transaction</h6>
            <span className="badge" style={{background:`${confidenceColor(parsed.confidence)}18`, color:confidenceColor(parsed.confidence)}}>
              <i className="bi bi-shield-check me-1"></i>{confidenceLabel(parsed.confidence)} confidence
            </span>
          </div>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <p style={{color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600}} className="mb-1">TYPE</p>
              <span className={`badge ${parsed.type === 'income' ? 'bg-success' : 'bg-danger'}`}>{parsed.type}</span>
            </div>
            <div className="col-6 col-md-3">
              <p style={{color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600}} className="mb-1">AMOUNT</p>
              <h5 className={`fw-800 mb-0 ${parsed.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {formatAmount(parsed.amount)}
              </h5>
            </div>
            <div className="col-6 col-md-3">
              <p style={{color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600}} className="mb-1">CURRENCY</p>
              <span className="fw-600">{parsed.currency}</span>
            </div>
            <div className="col-6 col-md-3">
              <p style={{color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600}} className="mb-1">PROVIDER</p>
              <span className="fw-600">{parsed.provider}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success flex-fill" onClick={handleConfirm} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-1"></i>}
              Confirm & Save
            </button>
            <button className="btn btn-light" onClick={() => setParsed(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Examples */}
      <div className="card p-4 no-hover">
        <h6 className="fw-700 mb-3">Example Messages</h6>
        <p style={{color:'var(--text-muted)', fontSize:'0.8125rem'}} className="mb-3">Click an example to try it:</p>
        {EXAMPLES.map((ex, i) => (
          <div key={i} className="p-3 mb-2" style={{border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:'0.8125rem', transition:'var(--transition)'}}
            onClick={() => { setMessage(ex); setParsed(null); setError(''); }}>
            <i className="bi bi-chat-left-text me-2" style={{color:'var(--primary)'}}></i>{ex}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
