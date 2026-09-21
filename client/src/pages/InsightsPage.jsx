import React, { useEffect, useState } from 'react';
import { get } from '../api/client';

const InsightsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await get('/reports/insights'); setData(data); } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div>;

  const typeIcon = { success: 'check-circle', warning: 'exclamation-triangle', info: 'info-circle', error: 'x-circle' };
  const typeBg = { success: 'var(--income-light)', warning: 'var(--warning-light)', info: 'var(--primary-light)', error: 'var(--expense-light)' };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h5 className="fw-700 mb-1">Financial Insights</h5>
        <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>Smart analysis of your spending patterns</p>
      </div>

      {!data || !data.insights || data.insights.length === 0 ? (
        <div className="card p-4 no-hover">
          <div className="empty-state">
            <i className="bi bi-lightbulb empty-state-icon"></i>
            <h5>No insights yet</h5>
            <p>Add more transactions to unlock personalized financial insights.</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {data.insights.map((insight, i) => (
            <div key={i} className="col-md-6 animate-slide-up" style={{animationDelay:`${i*0.05}s`, opacity:0}}>
              <div className="card p-4 h-100" style={{borderLeft:`4px solid ${insight.color || 'var(--primary)'}`}}>
                <div className="d-flex align-items-start gap-3">
                  <div className="category-icon" style={{background: typeBg[insight.type] || 'var(--primary-light)', color: insight.color || 'var(--primary)'}}>
                    <i className={`bi bi-${insight.icon || typeIcon[insight.type] || 'lightbulb'}`}></i>
                  </div>
                  <div>
                    <h6 className="fw-700 mb-1" style={{fontSize:'0.9375rem'}}>{insight.title}</h6>
                    <p className="mb-0" style={{color:'var(--text-secondary)', fontSize:'0.875rem'}}>{insight.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
