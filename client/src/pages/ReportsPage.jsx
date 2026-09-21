import React, { useEffect, useState, useContext } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AppContext } from '../context/AppContext';
import { get } from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const ReportsPage = () => {
  const { formatAmount } = useContext(AppContext);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try { const { data } = await get(`/reports/monthly?month=${month}&year=${year}`); setData(data); } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const catChart = data?.categories ? {
    labels: data.categories.map(c => c.name),
    datasets: [{ data: data.categories.map(c => c.total / 100), backgroundColor: data.categories.map(c => c.color || '#64748b'), borderRadius: 4, borderSkipped: false }]
  } : null;

  const pctChange = (curr, prev) => {
    if (!prev || prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-700 mb-1">Monthly Report</h5>
          <p className="mb-0" style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>Detailed breakdown of your finances</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-light" onClick={prevMonth}><i className="bi bi-chevron-left"></i></button>
          <span className="fw-600" style={{minWidth:'140px', textAlign:'center'}}>{monthName}</span>
          <button className="btn btn-sm btn-light" onClick={nextMonth}><i className="bi bi-chevron-right"></i></button>
        </div>
      </div>

      {loading ? <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div> : !data ? (
        <div className="card p-4 no-hover"><div className="empty-state">
          <i className="bi bi-bar-chart-line empty-state-icon"></i><h5>No data for this month</h5>
        </div></div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {[
              { label:'Income', value: data.income, prev: data.previousMonth?.income, color:'var(--income)', icon:'arrow-down-left' },
              { label:'Expenses', value: data.expenses, prev: data.previousMonth?.expenses, color:'var(--expense)', icon:'arrow-up-right' },
              { label:'Net Saved', value: data.net, prev: data.previousMonth?.net, color:'var(--primary)', icon:'piggy-bank' },
            ].map((item, i) => {
              const change = pctChange(item.value, item.prev);
              return (
                <div key={i} className="col-md-4">
                  <div className="card p-3 h-100">
                    <p style={{color:'var(--text-muted)', fontSize:'0.75rem', fontWeight:600}} className="mb-1">{item.label.toUpperCase()}</p>
                    <h4 className="fw-800 mb-1" style={{color: item.color}}>{formatAmount(item.value || 0)}</h4>
                    {change !== null && (
                      <small style={{color: (item.label === 'Expenses' ? change > 0 : change >= 0) ? (item.label === 'Expenses' ? 'var(--expense)' : 'var(--income)') : (item.label === 'Expenses' ? 'var(--income)' : 'var(--expense)'), fontWeight:600}}>
                        <i className={`bi bi-arrow-${change >= 0 ? 'up' : 'down'}-short`}></i>{Math.abs(change)}% vs last month
                      </small>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category Breakdown Chart */}
          {catChart && data.categories.length > 0 && (
            <div className="card p-4 mb-4 no-hover">
              <h6 className="fw-700 mb-3">Spending by Category</h6>
              <div style={{height: Math.max(200, data.categories.length * 40) + 'px'}}>
                <Bar data={catChart} options={{
                  indexAxis: 'y', maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true, grid: { color: 'var(--border)' } }, y: { grid: { display: false }, ticks: { font: { size: 12, family: 'Inter' } } } }
                }} />
              </div>
            </div>
          )}

          {/* Top Categories */}
          {data.categories && data.categories.length > 0 && (
            <div className="card p-4 no-hover">
              <h6 className="fw-700 mb-3">Top Categories</h6>
              {data.categories.slice(0, 8).map((c, i) => (
                <div key={i} className="d-flex align-items-center mb-3">
                  <div className="category-icon me-3" style={{background:`${c.color}18`, color:c.color}}>
                    <i className={`bi bi-${c.icon || 'tag'}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-600" style={{fontSize:'0.875rem'}}>{c.name}</span>
                      <span className="fw-700" style={{fontSize:'0.875rem'}}>{formatAmount(c.total)}</span>
                    </div>
                    <div className="progress" style={{height:'6px'}}>
                      <div className="progress-bar" style={{width:`${data.expenses > 0 ? (c.total / data.expenses * 100) : 0}%`, backgroundColor:c.color}}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
