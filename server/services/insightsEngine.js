const { db } = require('../config/database');

class InsightsEngine {
  getInsights(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const insights = [];

    // Top spending categories this month
    const topCategories = db.prepare(`
      SELECT c.name, c.icon, c.color, SUM(t.amount) as total 
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY total DESC
      LIMIT 5
    `).all(userId, startOfMonth, endOfMonth);

    // Total income and expenses this month
    const thisMonthSummary = db.prepare(`
      SELECT type, SUM(amount) as total FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY type
    `).all(userId, startOfMonth, endOfMonth);

    let thisMonthIncome = 0, thisMonthExpenses = 0;
    thisMonthSummary.forEach(r => {
      if (r.type === 'income') thisMonthIncome = r.total;
      if (r.type === 'expense') thisMonthExpenses = r.total;
    });

    // Last month totals for comparison
    const lastMonthSummary = db.prepare(`
      SELECT type, SUM(amount) as total FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY type
    `).all(userId, startOfLastMonth, endOfLastMonth);

    let lastMonthIncome = 0, lastMonthExpenses = 0;
    lastMonthSummary.forEach(r => {
      if (r.type === 'income') lastMonthIncome = r.total;
      if (r.type === 'expense') lastMonthExpenses = r.total;
    });

    // Compare spending by category
    const lastMonthCategories = db.prepare(`
      SELECT c.name, SUM(t.amount) as total 
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
    `).all(userId, startOfLastMonth, endOfLastMonth);

    const lastMonthMap = {};
    lastMonthCategories.forEach(c => { lastMonthMap[c.name] = c.total; });

    // Generate insights
    if (topCategories.length > 0) {
      insights.push({
        type: 'info',
        icon: 'pie-chart',
        title: 'Top Spending Category',
        description: `${topCategories[0].name} is your biggest expense this month at GHS ${(topCategories[0].total / 100).toFixed(2)}.`,
        color: topCategories[0].color
      });
    }

    // Category comparisons
    topCategories.forEach(cat => {
      const lastTotal = lastMonthMap[cat.name] || 0;
      if (lastTotal > 0) {
        const change = ((cat.total - lastTotal) / lastTotal * 100).toFixed(0);
        if (change > 10) {
          insights.push({
            type: 'warning',
            icon: 'arrow-up-circle',
            title: `${cat.name} Spending Up`,
            description: `You spent ${change}% more on ${cat.name} this month compared to last month.`,
            color: '#ef4444'
          });
        } else if (change < -10) {
          insights.push({
            type: 'success',
            icon: 'arrow-down-circle',
            title: `${cat.name} Spending Down`,
            description: `Great! You spent ${Math.abs(change)}% less on ${cat.name} this month.`,
            color: '#10b981'
          });
        }
      }
    });

    // Savings rate
    if (thisMonthIncome > 0) {
      const savingsRate = ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome * 100).toFixed(0);
      insights.push({
        type: savingsRate >= 20 ? 'success' : 'warning',
        icon: 'piggy-bank',
        title: 'Savings Rate',
        description: `You're saving ${savingsRate}% of your income this month. ${savingsRate >= 20 ? 'Great job!' : 'Try to save at least 20%.'}`,
        color: savingsRate >= 20 ? '#10b981' : '#f59e0b'
      });
    }

    // Income comparison
    if (lastMonthIncome > 0) {
      const incomeChange = thisMonthIncome - lastMonthIncome;
      if (incomeChange > 0) {
        insights.push({
          type: 'success',
          icon: 'graph-up-arrow',
          title: 'Income Increase',
          description: `Your income is GHS ${(incomeChange / 100).toFixed(2)} higher than last month.`,
          color: '#10b981'
        });
      }
    }

    // Budget utilization
    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ? AND is_active = 1').all(userId);
    let totalBudget = 0, totalBudgetSpent = 0;
    budgets.forEach(b => {
      totalBudget += b.amount;
      const budgetCats = db.prepare('SELECT category_id FROM budget_categories WHERE budget_id = ?').all(b.id);
      budgetCats.forEach(bc => {
        const spent = db.prepare(`
          SELECT SUM(amount) as total FROM transactions
          WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        `).get(userId, bc.category_id, startOfMonth, endOfMonth);
        totalBudgetSpent += (spent.total || 0);
      });
    });

    if (totalBudget > 0) {
      const utilization = (totalBudgetSpent / totalBudget * 100).toFixed(0);
      insights.push({
        type: utilization > 90 ? 'warning' : 'info',
        icon: 'speedometer2',
        title: 'Budget Utilization',
        description: `You've used ${utilization}% of your total monthly budget.`,
        color: utilization > 90 ? '#ef4444' : utilization > 70 ? '#f59e0b' : '#4f46e5'
      });
    }

    return {
      insights,
      topCategories,
      thisMonth: { income: thisMonthIncome, expenses: thisMonthExpenses, net: thisMonthIncome - thisMonthExpenses },
      lastMonth: { income: lastMonthIncome, expenses: lastMonthExpenses, net: lastMonthIncome - lastMonthExpenses }
    };
  }
}

module.exports = new InsightsEngine();
