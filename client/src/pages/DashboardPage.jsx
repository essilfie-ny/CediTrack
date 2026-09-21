import React, { useEffect, useState, useContext } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { get } from '../api/client';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardPage = () => {
  const { formatAmount, accounts, refreshAccounts } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, net: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [spendingData, setSpendingData] = useState([]);

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, catRes, txRes, billRes, budgetRes, spendRes] = await Promise.allSettled([
          get(`/transactions/summary?startDate=${startOfMonth}&endDate=${endOfMonth}`),
          get(`/reports/category-breakdown?startDate=${startOfMonth}&endDate=${endOfMonth}`),
          get('/transactions?limit=5'),
          get('/reminders/upcoming'),
          get('/budgets'),
          get(`/reports/spending-over-time?period=daily&startDate=${startOfMonth}&endDate=${endOfMonth}`)
        ]);
        if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
        if (catRes.status === 'fulfilled') setCategoryBreakdown(catRes.value.data);
        if (txRes.status === 'fulfilled') setRecentTx(txRes.value.data);
        if (billRes.status === 'fulfilled') setUpcomingBills(billRes.value.data);
        if (budgetRes.status === 'fulfilled') setBudgets(budgetRes.value.data);
        if (spendRes.status === 'fulfilled') setSpendingData(spendRes.value.data);
        refreshAccounts();
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const budgetColor = budgetPct > 90 ? 'var(--expense)' : budgetPct > 70 ? 'var(--warning)' : 'var(--income)';

  const pieData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [{
      data: categoryBreakdown.map(c => c.total / 100),
      backgroundColor: categoryBreakdown.map(c => c.color || '#64748b'),
      borderWidth: 0,
      hoverOffset: 6,
    }]
  };

  const barData = {
    labels: spendingData.map(d => { const parts = d.period_key.split('-'); return `${parts[2] || parts[1]}`; }),
    datasets: [{
      label: 'Spending (GHS)',
      data: spendingData.map(d => d.total / 100),
      backgroundColor: 'rgba(79,70,229,0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const formatDueLabel = (dateStr) => {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Due Tomorrow';
    return `Due in ${diff} days`;
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Balance Card */}
      <div className="card balance-card p-4 mb-4 no-hover" style={{borderRadius: '16px'}}>
        <div style={{position:'relative', zIndex:1}}>
          <p className="mb-1 opacity-75" style={{fontSize:'0.875rem', fontWeight:500}}>Total Balance</p>
          <h1 className="fs-display mb-2">{formatAmount(totalBalance)}</h1>
          {summary.net > 0 ? (
            <span className="badge px-3 py-2 rounded-pill" style={{background:'rgba(255,255,255,0.2)', color:'white', fontSize:'0.8rem'}}>
              <i className="bi bi-arrow-up-short"></i> +{formatAmount(summary.net)} this month
            </span>
          ) : summary.net < 0 ? (
            <span className="badge px-3 py-2 rounded-pill" style={{background:'rgba(255,255,255,0.2)', color:'white', fontSize:'0.8rem'}}>
              <i className="bi bi-arrow-down-short"></i> {formatAmount(summary.net)} this month
            </span>
          ) : null}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4 animate-slide-up stagger-1">
          <div className="card summary-card p-3 h-100" style={{borderLeft: '4px solid var(--income)'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1" style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600}}>Income</p>
                <h4 className="text-income fw-800 mb-0" style={{fontSize:'1.35rem'}}>{formatAmount(summary.income)}</h4>
              </div>
              <div className="category-icon" style={{background:'var(--income-light)', color:'var(--income)'}}>
                <i className="bi bi-arrow-down-left"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 animate-slide-up stagger-2">
          <div className="card summary-card p-3 h-100" style={{borderLeft: '4px solid var(--expense)'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1" style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600}}>Expenses</p>
                <h4 className="text-expense fw-800 mb-0" style={{fontSize:'1.35rem'}}>{formatAmount(summary.expenses)}</h4>
              </div>
              <div className="category-icon" style={{background:'var(--expense-light)', color:'var(--expense)'}}>
                <i className="bi bi-arrow-up-right"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 animate-slide-up stagger-3">
          <div className="card summary-card p-3 h-100" style={{borderLeft: '4px solid var(--primary)'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="mb-1" style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600}}>Savings</p>
                <h4 className="fw-800 mb-0" style={{fontSize:'1.35rem', color:'var(--primary)'}}>{formatAmount(summary.income - summary.expenses)}</h4>
              </div>
              <div className="category-icon" style={{background:'var(--primary-light)', color:'var(--primary)'}}>
                <i className="bi bi-piggy-bank"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress + Quick Actions */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 animate-slide-up stagger-2">
          <div className="card p-4 h-100 no-hover">
            <h6 className="fw-700 mb-3" style={{fontSize:'0.9375rem'}}>Monthly Spending</h6>
            {totalBudget > 0 ? (
              <>
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-600" style={{fontSize:'0.875rem'}}>{formatAmount(summary.expenses)}</span>
                  <span style={{fontSize:'0.8125rem', color:'var(--text-muted)'}}>Budget: {formatAmount(totalBudget)}</span>
                </div>
                <div className="progress mb-2" style={{height:'10px'}}>
                  <div className="progress-bar" style={{width: `${Math.min(budgetPct, 100)}%`, backgroundColor: budgetColor, animation:'progressFill 1.2s ease'}}></div>
                </div>
                <p style={{fontSize:'0.8125rem', color: budgetColor, fontWeight:600, margin:0}}>
                  {budgetPct > 100 ? `Over budget by ${formatAmount(summary.expenses - totalBudget)}` : `${budgetPct}% of budget used`}
                </p>
              </>
            ) : (
              <div className="text-center py-3">
                <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>No budget set</p>
                <Link to="/budgets" className="btn btn-sm btn-outline-primary">Create Budget</Link>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6 animate-slide-up stagger-3">
          <div className="card p-4 h-100 no-hover">
            <h6 className="fw-700 mb-3" style={{fontSize:'0.9375rem'}}>Quick Actions</h6>
            <div className="row g-2">
              {[
                {icon:'bi-dash-circle', label:'Expense', color:'var(--expense)', bg:'var(--expense-light)', to:'/transactions'},
                {icon:'bi-plus-circle', label:'Income', color:'var(--income)', bg:'var(--income-light)', to:'/transactions'},
                {icon:'bi-arrow-left-right', label:'Transfer', color:'var(--info)', bg:'rgba(59,130,246,0.1)', to:'/accounts'},
                {icon:'bi-chat-left-text', label:'Import', color:'#7c3aed', bg:'rgba(124,58,237,0.1)', to:'/messages'},
                {icon:'bi-bullseye', label:'Goals', color:'var(--warning)', bg:'var(--warning-light)', to:'/goals'},
                {icon:'bi-bar-chart-line', label:'Reports', color:'#06b6d4', bg:'rgba(6,182,212,0.1)', to:'/reports'},
              ].map((a, i) => (
                <div className="col-4" key={i}>
                  <Link to={a.to} className="quick-action-btn w-100">
                    <i className={`bi ${a.icon}`} style={{color: a.color, background: a.bg}}></i>
                    <span>{a.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 animate-slide-up stagger-3">
          <div className="card p-4 h-100 no-hover">
            <h6 className="fw-700 mb-3" style={{fontSize:'0.9375rem'}}>Expenses by Category</h6>
            {categoryBreakdown.length > 0 ? (
              <div style={{height:'260px', display:'flex', justifyContent:'center'}}>
                <Doughnut data={pieData} options={{
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: 'Inter' } } }
                  }
                }} />
              </div>
            ) : (
              <div className="empty-state py-4">
                <i className="bi bi-pie-chart empty-state-icon" style={{fontSize:'2rem'}}></i>
                <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>No expense data yet</p>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6 animate-slide-up stagger-4">
          <div className="card p-4 h-100 no-hover">
            <h6 className="fw-700 mb-3" style={{fontSize:'0.9375rem'}}>Spending Over Time</h6>
            {spendingData.length > 0 ? (
              <div style={{height:'260px'}}>
                <Bar data={barData} options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'var(--border)' }, ticks: { font: { size: 10, family: 'Inter' } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' } } }
                  }
                }} />
              </div>
            ) : (
              <div className="empty-state py-4">
                <i className="bi bi-bar-chart empty-state-icon" style={{fontSize:'2rem'}}></i>
                <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>No spending data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions + Upcoming Bills */}
      <div className="row g-3">
        <div className="col-md-8 animate-slide-up stagger-4">
          <div className="card p-4 h-100 no-hover">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-700 mb-0" style={{fontSize:'0.9375rem'}}>Recent Transactions</h6>
              <Link to="/transactions" className="btn btn-sm btn-link text-decoration-none" style={{color:'var(--primary)', fontWeight:600, fontSize:'0.8125rem'}}>View All →</Link>
            </div>
            {recentTx.length > 0 ? recentTx.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="category-icon me-3" style={{background: tx.category_color ? `${tx.category_color}18` : 'var(--border)', color: tx.category_color || 'var(--text-muted)'}}>
                  <i className={`bi bi-${tx.category_icon || 'receipt'}`}></i>
                </div>
                <div className="flex-grow-1" style={{minWidth:0}}>
                  <h6 className="mb-0 text-truncate" style={{fontSize:'0.875rem', fontWeight:600}}>{tx.description || tx.merchant || tx.category_name || 'Transaction'}</h6>
                  <small style={{color:'var(--text-muted)', fontSize:'0.75rem'}}>{tx.category_name} · {tx.date}</small>
                </div>
                <div className={`fw-700 ${tx.type === 'income' ? 'text-income' : 'text-expense'}`} style={{fontSize:'0.9rem', whiteSpace:'nowrap'}}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                </div>
              </div>
            )) : (
              <div className="empty-state py-3">
                <i className="bi bi-receipt empty-state-icon" style={{fontSize:'2rem'}}></i>
                <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>No transactions yet</p>
                <Link to="/transactions" className="btn btn-sm btn-primary">Add Transaction</Link>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-4 animate-slide-up stagger-4">
          <div className="card p-4 h-100 no-hover">
            <h6 className="fw-700 mb-3" style={{fontSize:'0.9375rem'}}>Upcoming Bills</h6>
            {upcomingBills.length > 0 ? upcomingBills.slice(0, 4).map(bill => {
              const dueText = formatDueLabel(bill.due_date);
              const isOverdue = dueText === 'Overdue';
              return (
                <div key={bill.id} className="mb-3 p-3" style={{border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'}}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-600" style={{fontSize:'0.875rem'}}>{bill.name}</span>
                    <span className="fw-700" style={{fontSize:'0.875rem'}}>{formatAmount(bill.amount)}</span>
                  </div>
                  <span className="badge" style={{
                    background: isOverdue ? 'var(--expense-light)' : 'var(--warning-light)',
                    color: isOverdue ? 'var(--expense)' : 'var(--warning)',
                    fontSize:'0.6875rem'
                  }}>
                    <i className="bi bi-clock me-1"></i>{dueText}
                  </span>
                </div>
              );
            }) : (
              <div className="empty-state py-3">
                <i className="bi bi-bell empty-state-icon" style={{fontSize:'2rem'}}></i>
                <p style={{color:'var(--text-muted)', fontSize:'0.875rem'}}>No upcoming bills</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
