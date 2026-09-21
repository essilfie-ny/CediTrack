const { db } = require('../config/database');

class BudgetService {
  getBudgetsWithSpending(userId) {
    const budgets = db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId);
    const result = [];

    for (const b of budgets) {
      const categories = db.prepare('SELECT category_id, amount FROM budget_categories WHERE budget_id = ?').all(b.id);
      let spent = 0;
      
      if (categories.length === 0) {
        const row = db.prepare(`
          SELECT SUM(amount) as total FROM transactions 
          WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?
        `).get(userId, b.start_date, b.end_date || '9999-12-31');
        spent = row?.total || 0;
      } else {
        for (const cat of categories) {
          const row = db.prepare(`
            SELECT SUM(amount) as total FROM transactions 
            WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date >= ? AND date <= ?
          `).get(userId, cat.category_id, b.start_date, b.end_date || '9999-12-31');
          spent += (row?.total || 0);
        }
      }
      
      result.push({
        ...b,
        categories,
        spent
      });
    }

    return result;
  }
}

module.exports = new BudgetService();
